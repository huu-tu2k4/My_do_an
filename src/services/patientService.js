import db from "../models/index";
require('dotenv').config();
import emailService from "./emailService";
import { v4 as uuidv4 } from 'uuid';

let buildUrlEmail = (doctorId, token) => {
    return `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email 
                || !data.doctorId 
                || !data.timeType 
                || !data.date 
                || !data.firstName 
                || !data.lastName 
                || !data.doctorName 
                || !data.selectedGender 
                || !data.address) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
                return;
            }

            let token = uuidv4();

            let [user, userCreated] = await db.User.findOrCreate({
                where: { email: data.email },
                defaults: {
                    email: data.email,
                    roleId: 'R3',
                    gender: data.selectedGender,
                    address: data.address,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneNumber: data.phoneNumber
                }
            });

            if (!(user && user.id)) {
                resolve({
                    errCode: 3,
                    errMessage: 'Could not create booking.'
                });
                return;
            }

            let t;
            try {
                t = await db.sequelize.transaction();

                let scheduleTx = await db.Schedule.findOne({
                    where: {
                        doctorId: data.doctorId,
                        date: String(data.date),
                        timeType: data.timeType
                    },
                    raw: false,
                    transaction: t
                });

                if (!scheduleTx) {
                    if (t) await t.rollback();
                    resolve({
                        errCode: 5,
                        errMessage: 'Selected time slot is no longer available.'
                    });
                    return;
                }

                if (typeof scheduleTx.currentNumber === 'number' && typeof scheduleTx.maxNumber === 'number') {
                    if (scheduleTx.currentNumber >= scheduleTx.maxNumber) {
                        if (t) await t.rollback();
                        resolve({
                            errCode: 4,
                            errMessage: 'This time slot is full.'
                        });
                        return;
                    }
                }

                let [booking, bookingCreated] = await db.Booking.findOrCreate({
                    where: {
                        patientId: user.id,
                        doctorId: data.doctorId,
                        date: String(data.date),
                        timeType: data.timeType
                    },
                    defaults: {
                        statusId: 'S1',
                        doctorId: data.doctorId,
                        patientId: user.id,
                        date: String(data.date),
                        timeType: data.timeType,
                        token: token
                    },
                    transaction: t
                });

                if (!bookingCreated) {
                    if (t) await t.rollback();
                    resolve({
                        errCode: 2,
                        errMessage: 'You have already booked this slot!'
                    });
                    return;
                }

                try {
                    scheduleTx.currentNumber = (scheduleTx.currentNumber || 0) + 1;
                    await scheduleTx.save({ transaction: t });
                } catch (err) {
                    if (t) await t.rollback();
                    console.error('[patientService.postBookAppointment] failed to increment schedule currentNumber', err);
                    resolve({
                        errCode: 6,
                        errMessage: 'Failed to reserve the slot, please try again.'
                    });
                    return;
                }

                await t.commit();

                try {
                    await emailService.sendSimpleEmail({
                        receiveEmail: data.email,
                        patientName: `${data.firstName} ${data.lastName}`,
                        time: data.timeString,
                        doctorName: data.doctorName,
                        language: data.language,
                        redirectLink: buildUrlEmail(data.doctorId, token),
                        type: 'Booking'
                    });
                } catch (err) {
                    console.error('[patientService.postBookAppointment] send email failed', err);
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Appointment booked successfully!'
                });
                return;
            } catch (err) {
                if (t) await t.rollback();
                throw err;
            }
        } catch (e) {
            reject(e);
        }
    });
}

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            }
            let booking = await db.Booking.findOne({
                where: {
                    doctorId: data.doctorId,
                    token: data.token,
                    statusId: 'S1'
                },
                raw: false
            })
            if (booking) {
                booking.statusId = 'S2';
                await booking.save();
                resolve({
                    errCode: 0,
                    errMessage: 'Appointment verified successfully!'
                })
            }
            else {
                resolve({
                    errCode: 2,
                    errMessage: 'Appointment has been activated or does not exist!'
                })
            }
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    postBookAppointment: postBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment
}