import emailService from './emailService';
import db from '../models/index';
import { request } from 'express';
import _ from 'lodash';

require('dotenv').config();

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
let getTopDoctorHome = (limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            let fetchLimit = +limit || 10;
            let users = await db.User.findAll({
                limit: fetchLimit,
                where: { roleId: 'R2' },
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password'],
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                ],
                raw: true,
                nest: true,
            });
            resolve({
                errCode: 0,
                errMessage: 'OK',
                users: users
            });
        } catch (error) {
            reject(error);
        }
    });
};

let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password', 'image', 'createdAt', 'updatedAt'],
                },
            });
            resolve({
                errCode: 0,
                errMessage: 'OK',
                data: doctors
            });
        } catch (error) {
            reject(error);
        }
    });
};

let checkRequiredFields = (inputData) => {
    let arrFields = ['doctorId', 
        'contentHTML', 
        'contentMarkdown', 
        'action', 
        'selectedPrice', 
        'selectedPayment', 
        'selectedProvince', 
        'nameClinic', 
        'addressClinic', 
        'specialtyId'];
    let isValid = true;
    let element = '';
    for(let i = 0; i < arrFields.length; i++) {
        if(!inputData[arrFields[i]]) {
            isValid = false;
            element = arrFields[i];
            break;
        }
    }
    return { isValid, element };
}

let postInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { isValid, element } = checkRequiredFields(inputData);
            if(!isValid) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing required parameter: ${element}`
                });
            }
            else{
                // Upsert to Markdown table
                if(inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    })
                }
                else if(inputData.action === 'EDIT') {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false
                    });
                    if(doctorMarkdown) {
                        await doctorMarkdown.update({
                            contentHTML: inputData.contentHTML,
                            contentMarkdown: inputData.contentMarkdown,
                            description: inputData.description
                        });
                    }
                }

                // Upsert to doctor_infor table
                let doctorInfor = await db.Doctor_Infor.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false
                });
                if(doctorInfor) {
                    // Update existing record
                    await doctorInfor.update({
                        priceId: inputData.selectedPrice,
                        provinceId: inputData.selectedProvince,
                        paymentId: inputData.selectedPayment,
                        addressClinic: inputData.addressClinic,
                        nameClinic: inputData.nameClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId
                    });
                }
                else {
                    // Create new record
                    await db.Doctor_Infor.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        provinceId: inputData.selectedProvince,
                        paymentId: inputData.selectedPayment,
                        addressClinic: inputData.addressClinic,
                        nameClinic: inputData.nameClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId
                    });
                }

                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
            
        } catch (error) {
            reject(error);
        }
    });
};

let getDetailDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let data = await db.User.findOne({
                    where: { id: id },
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        { model: db.Markdown, as: 'markdownData', attributes: ['contentHTML', 'contentMarkdown', 'description'] },
                        
                        { model: db.Doctor_Infor, 
                            as: 'doctorInforData', 
                            attributes: {exclude: ['id', 'doctorId', 'createdAt', 'updatedAt']}, 
                            include: [
                                { model: db.Allcode, as: 'priceData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Specialty, as: 'specialtyData', attributes: ['nameVi', 'nameEn'] },
                            ] 
                        },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: true,
                    nest: true
                });
                if(data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if(!data) data = {};
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.arrSchedule || !data.doctorId || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let schedule = data.arrSchedule;
                if(schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        // ensure timeType is stored as string to match Allcode.keyMap (varchar)
                        if (item.timeType !== undefined && item.timeType !== null) item.timeType = String(item.timeType);
                        return item;
                    });
                }
                // Full sync: create missing, update existing, delete removed (in a transaction)
                let t;
                try {
                    t = await db.sequelize.transaction();

                    let existing = await db.Schedule.findAll({
                        where: {
                            doctorId: data.doctorId,
                            date: String(data.date)
                        },
                        attributes: ['id', 'timeType', 'date', 'doctorId', 'maxNumber'],
                        raw: true,
                        transaction: t
                    });

                    const comparator = (a, b) => {
                        return a.timeType === b.timeType && +a.date === +b.date && a.doctorId === b.doctorId;
                    };

                    let toCreate = _.differenceWith(schedule, existing, comparator);
                    if(toCreate && toCreate.length > 0) {
                        await db.Schedule.bulkCreate(toCreate, { transaction: t });
                    }

                    let toUpdate = _.intersectionWith(schedule, existing, comparator);
                    for(let i = 0; i < toUpdate.length; i++) {
                        const match = existing.find(e => e.timeType === toUpdate[i].timeType && +e.date === +toUpdate[i].date && e.doctorId === toUpdate[i].doctorId);
                        if(match) {
                            await db.Schedule.update(
                                { maxNumber: toUpdate[i].maxNumber },
                                { where: { id: match.id }, transaction: t }
                            );
                        }
                    }

                    // delete schedules that exist in DB but are not present in incoming schedule
                    let toDelete = _.differenceWith(existing, schedule, comparator);
                    if(toDelete && toDelete.length > 0) {
                        const idsToDelete = toDelete.map(d => d.id);
                        await db.Schedule.destroy({ where: { id: idsToDelete }, transaction: t });
                    }

                    await t.commit();
                } catch (err) {
                    if(t) await t.rollback();
                    throw err;
                }
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let editBulkSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.arrSchedule || !data.doctorId || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let schedule = data.arrSchedule;
                if(schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        // ensure timeType is stored as string to match Allcode.keyMap (varchar)
                        if (item.timeType !== undefined && item.timeType !== null) item.timeType = String(item.timeType);
                        return item;
                    });
                }

                // Full sync: create missing, update existing, delete removed (in a transaction)
                let t;
                try {
                    t = await db.sequelize.transaction();

                    let existing = await db.Schedule.findAll({
                        where: {
                            doctorId: data.doctorId,
                            date: String(data.date)
                        },
                        attributes: ['id', 'timeType', 'date', 'doctorId', 'maxNumber'],
                        raw: true,
                        transaction: t
                    });

                    const comparator = (a, b) => {
                        return a.timeType === b.timeType && +a.date === +b.date && a.doctorId === b.doctorId;
                    };

                    let toCreate = _.differenceWith(schedule, existing, comparator);
                    if(toCreate && toCreate.length > 0) {
                        await db.Schedule.bulkCreate(toCreate, { transaction: t });
                    }

                    let toUpdate = _.intersectionWith(schedule, existing, comparator);
                    for(let i = 0; i < toUpdate.length; i++) {
                        const match = existing.find(e => e.timeType === toUpdate[i].timeType && +e.date === +toUpdate[i].date && e.doctorId === toUpdate[i].doctorId);
                        if(match) {
                            await db.Schedule.update(
                                { maxNumber: toUpdate[i].maxNumber },
                                { where: { id: match.id }, transaction: t }
                            );
                        }
                    }

                    let toDelete = _.differenceWith(existing, schedule, comparator);
                    if(toDelete && toDelete.length > 0) {
                        const idsToDelete = toDelete.map(d => d.id);
                        await db.Schedule.destroy({ where: { id: idsToDelete }, transaction: t });
                    }

                    await t.commit();
                } catch (err) {
                    if(t) await t.rollback();
                    throw err;
                }
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getScheduleByDateService = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let data = await db.Schedule.findAll({
                    where: { doctorId: doctorId, date: String(date) },
                    include: [
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName'] },
                    ],
                    raw: true,
                    nest: true
                });
                if(!data) data = [];
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getExtraInforDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let data = await db.Doctor_Infor.findOne({
                    where: { doctorId: doctorId },
                    attributes: {exclude: ['id', 'doctorId', 'createdAt', 'updatedAt']}, 
                    include: [
                        { model: db.Allcode, as: 'priceData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'provinceData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: true,
                    nest: true
                });
                if(!data) data = {};
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getProfileDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let data = await db.User.findOne({
                    where: { id: doctorId },
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Doctor_Infor, 
                            as: 'doctorInforData', 
                            attributes: {exclude: ['id', 'doctorId', 'createdAt', 'updatedAt']},
                            include: [
                                { model: db.Allcode, as: 'priceData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                        { model: db.Markdown, as: 'markdownData', attributes: ['description'] }
                    ],
                    raw: true,
                    nest: true
                });
                if(data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if(!data) data = {};
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getListPatientForDoctor = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                let data = await db.Booking.findAll({
                    where: { doctorId: doctorId,
                        date: String(date), 
                        statusId: 'S2' },
                    include: [
                        { model: db.User, as: 'patientData', attributes: ['email', 'firstName', 'lastName', 'address', 'gender', 'phoneNumber'],
                            include: [
                                { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        },
                        { model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: true,
                    nest: true
                });
                if(!data) data = {};
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.email || !data.doctorId || !data.patientId || !data.timeType) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                // Update patient status
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                });
                if(appointment) {
                    appointment.statusId = 'S3';
                    await appointment.save();
                }
                await emailService.sendAttachment(data);
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    editBulkSchedule: editBulkSchedule,
    getScheduleByDateService: getScheduleByDateService,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy
};