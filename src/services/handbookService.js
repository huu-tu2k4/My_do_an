import db from '../models/index';
import { Op } from 'sequelize';
require('dotenv').config();

let createCategory = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.nameVi || !data.nameEn || !data.descriptionHTML || !data.descriptionMarkdown || !data.specialtyId) {
                resolve({ errCode: 1, errMessage: 'Missing parameter' });
            } else {
                await db.Handbook.create({
                    nameVi: data.nameVi,
                    nameEn: data.nameEn,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkdown: data.descriptionMarkdown,
                    image: data.imageBase64,
                    specialtyId: data.specialtyId
                });
                resolve({ errCode: 0, errMessage: 'OK' });
            }
        } catch (e) {
            reject(e);
        }
    });
}

let getAllCategories = async (q) => {
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
            let data = await db.Handbook.findAll({
                where,
                order: [['id', 'DESC']],
                include: [{ model: db.Specialty, as: 'specialtyData', attributes: ['id', 'nameVi', 'nameEn'] }],
                raw: false
            });
            if (data && data.length > 0) {
                data.map(item => {
                    if (item.image) item.image = Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                });
            }
            resolve({ errCode: 0, errMessage: 'OK', data });
        } catch (e) {
            reject(e);
        }
    });
}

let getCategoryById = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({ errCode: 1, errMessage: 'Missing parameter' });
            } else {
                let data = await db.Handbook.findOne({ where: { id }, include: [{ model: db.Specialty, as: 'specialtyData', attributes: ['id', 'nameVi', 'nameEn'] }], raw: false });
                if (data && data.image) data.image = Buffer.from(data.image, 'base64').toString('binary');
                resolve({ errCode: 0, errMessage: 'OK', data });
            }
        } catch (e) {
            reject(e);
        }
    });
}

let updateCategory = async (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({ errCode: 1, errMessage: 'Missing parameter' });
            } else {
                let category = await db.Handbook.findOne({ where: { id } });
                if (!category) {
                    resolve({ errCode: 2, errMessage: 'Category not found' });
                } else {
                    await db.Handbook.update({
                        nameVi: data.nameVi || category.nameVi,
                        nameEn: data.nameEn || category.nameEn,
                        descriptionHTML: data.descriptionHTML || category.descriptionHTML,
                        descriptionMarkdown: data.descriptionMarkdown || category.descriptionMarkdown,
                        image: data.imageBase64 || category.image,
                        specialtyId: data.specialtyId || category.specialtyId
                    }, { where: { id } });
                    resolve({ errCode: 0, errMessage: 'OK' });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
}

let deleteCategory = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({ errCode: 1, errMessage: 'Missing parameter' });
            } else {
                let category = await db.Handbook.findOne({ where: { id } });
                if (!category) {
                    resolve({ errCode: 2, errMessage: 'Category not found' });
                } else {
                    await db.Handbook.destroy({ where: { id } });
                    resolve({ errCode: 0, errMessage: 'OK' });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
}
