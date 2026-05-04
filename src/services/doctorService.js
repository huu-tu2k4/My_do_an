
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

let postInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!inputData.doctorId || !inputData.contentHTML || !inputData.contentMarkdown || !inputData.action || !inputData.selectedPrice || !inputData.selectedPayment || !inputData.selectedProvince || !inputData.nameClinic || !inputData.addressClinic) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
                // Upsert to Markdown table
                if(inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId
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
                        note: inputData.note
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
                        note: inputData.note
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
                                { model: db.Allcode, as: 'paymentData', attributes: ['valueEn', 'valueVi'] }
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
                        return item;
                    });
                }
                // let result = await db.Schedule.bulkCreate(schedule, 
                //     // {updateOnDuplicate: ['maxNumber', 'date', 'timeType', 'doctorId']}
                // );

                let existing = await db.Schedule.findAll({
                    where: {
                        doctorId: data.doctorId,
                        date: data.date
                    },
                    attributes: ['timeType', 'date', 'doctorId', 'maxNumber'],
                    raw: true
                });
                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date && a.doctorId === b.doctorId;
                });
                if(toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }

                // Continue with the rest of the logic...
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
                    where: { doctorId: doctorId, date: date },
                    include: [
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },],
                    //     { model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName'] },
                    // ],
                    raw: true,
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
                console.log('check doctorId: ', typeof(doctorId));
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

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDateService: getScheduleByDateService,
    getExtraInforDoctorById: getExtraInforDoctorById
};