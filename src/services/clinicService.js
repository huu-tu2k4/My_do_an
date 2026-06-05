import db from "../models/index";
import { Op } from 'sequelize';

let createClinic = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.name || !data.address || !data.imageBase64) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else {
                await db.Clinic.create({
                    name: data.name,
                    address: data.address,
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

let getAllClinic = async (q, page, limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            const where = {};
            if (q && typeof q === 'string' && q.trim() !== '') {
                const like = `%${q.trim()}%`;
                where.name = { [Op.iLike]: like };
            }
            if (page !== undefined && limit !== undefined) {
                const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
                const result = await db.Clinic.findAndCountAll({ where, order: [['id', 'DESC']], limit: parseInt(limit, 10), offset });

                if (result && result.rows && result.rows.length > 0) {
                    result.rows = result.rows.map(item => {
                        if (item.image) item.image = Buffer.from(item.image, 'base64').toString('binary');
                        return item;
                    });
                }
                resolve(result);
            } else {
                let data = await db.Clinic.findAll({ where, order: [['id', 'DESC']] });
                if (data && data.length > 0) {
                    data = data.map(item => {
                        if (item.image) item.image = Buffer.from(item.image, 'base64').toString('binary');
                        return item;
                    });
                }
                resolve({ rows: data, count: data.length });
            }
        } catch (e) {
            reject(e);
        }
    });
}

let getDetailClinicById = async (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                });
            }
            else {
                let data = await db.Clinic.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: ['name', 'address', 'descriptionHTML', 'descriptionMarkdown'],
                });
                if (data) {
                    data = data.get({ plain: true });
                    const doctorClinic = await db.Doctor_Infor.findAll({
                        where: { clinicId: inputId },
                        attributes: ['doctorId', 'provinceId']
                    });
                    data.doctorClinic = doctorClinic;
                }
                resolve({
                    errCode: 0,
                    errMessage: 'OK',
                    data
                });
            }
        } catch (e) {
            reject(e);
        }
    });
}

let updateClinic = async (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({ errCode: 1, errMessage: 'Missing required parameters' });
            } else {
                let clinic = await db.Clinic.findOne({ where: { id } });
                if (!clinic) {
                    resolve({ errCode: 2, errMessage: 'Clinic not found' });
                } else {
                    await db.Clinic.update({
                        name: data.name || clinic.name,
                        address: data.address || clinic.address,
                        descriptionHTML: data.descriptionHTML || clinic.descriptionHTML,
                        descriptionMarkdown: data.descriptionMarkdown || clinic.descriptionMarkdown,
                        image: data.imageBase64 || clinic.image
                    }, { where: { id } });
                    resolve({ errCode: 0, errMessage: 'OK' });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
}


module.exports = {
    createClinic: createClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById,
    updateClinic: updateClinic
}

