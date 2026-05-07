import db from "../models/index";
require('dotenv').config();
import emailService from "./emailService";
import { v4 as uuidv4 } from 'uuid';

let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`;
    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date || !data.fullName || !data.doctorName) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            }
            else {
                let token = uuidv4();
                await emailService.sendSimpleEmail({
                    receiveEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token)
                });

                //upSert patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                    }
                })

                //create a booking record
                if (user && user[0]) {
                    let booking = await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token
                        }
                    });
                    // console.log("check booking: ", booking[1]);
                    // if (booking && booking[1] === false && booking[0].date === data.date && booking[0].timeType === data.timeType && booking[0].doctorId === data.doctorId) {
                    //     resolve({
                    //         errCode: 2,
                    //         errMessage: 'You have already booked an appointment!'
                    //     })
                    // }
                    // else if(booking && booking[1] === false && booking[0].date === data.date && booking[0].timeType === data.timeType && booking[0].doctorId !== data.doctorId) {
                    //     resolve({
                    //         errCode: 3,
                    //         errMessage: 'You have already booked an appointment for a different doctor!'
                    //     })
                    // }
                    // else if(booking && booking[1] === false && booking[0].date === data.date && booking[0].timeType !== data.timeType) {
                    //     resolve({
                    //         errCode: 4,
                    //         errMessage: 'You have already booked an appointment for a different time!'
                    //     })
                    // }
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Appointment booked successfully!'
                });
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