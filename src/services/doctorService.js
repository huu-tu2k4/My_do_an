import e from 'cors';
import db from '../models/index';
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
                    exclude: ['password', 'image'],
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
            if(!inputData.doctorId || !inputData.contentHTML || !inputData.contentMarkdown || !inputData.action) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else{
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
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: true,
                    nest: true,
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

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById
};