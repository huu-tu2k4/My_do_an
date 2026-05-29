import db from '../models/index';
import { Op } from 'sequelize';
require('dotenv').config();

let createSpecialty = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.nameVi || !data.nameEn || !data.imageBase64 || !data.descriptionHTML || !data.descriptionMarkdown) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                });
            }
            else {
                await db.Specialty.create({
                    nameVi: data.nameVi,
                    nameEn: data.nameEn,
                    image: data.imageBase64,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkdown: data.descriptionMarkdown,
                });
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
        } catch (e) {
            reject(e);
        }
    });
}

let getAllSpecialty = async (q) => {
    return new Promise(async (resolve, reject) => {
        try {
            const where = {};
            if (q && typeof q === 'string' && q.trim() !== '') {
                const like = `%${q.trim()}%`;
                where[Op.or] = [
                    { nameVi: { [Op.iLike]: like } },
                    { nameEn: { [Op.iLike]: like } }
                ];
            }
            let data = await db.Specialty.findAll({ where });
            if (data && data.length > 0) {
                data.map(item => {
                    item.image = new Buffer(item.image, 'base64').toString('binary');
                    return item;
                });
            }
            resolve({
                errCode: 0,
                errMessage: 'OK',
                data
            });
        }
        catch (e) {
            reject(e);
        }
    });
}

let getDetailSpecialtyById = async (inputId, location) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId || !location) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                });
            }
            else {
                let data = await db.Specialty.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: ['descriptionHTML', 'descriptionMarkdown', 'nameVi', 'nameEn']
                });
                if (data) {
                    data = data.get({ plain: true });
                    let doctorSpecialty = [];
                    if (location === 'ALL') {
                        doctorSpecialty = await db.Doctor_Infor.findAll({
                            where: { specialtyId: inputId },
                            attributes: ['doctorId', 'provinceId']
                        });
                    }
                    else {
                        doctorSpecialty = await db.Doctor_Infor.findAll({
                            where: {
                                specialtyId: inputId,
                                provinceId: location
                            },
                            attributes: ['doctorId', 'provinceId']
                        });
                    }
                    data.doctorSpecialty = doctorSpecialty;
                }
                else data = {};
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data
                });
            }
        }
        catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getDetailSpecialtyById: getDetailSpecialtyById
}