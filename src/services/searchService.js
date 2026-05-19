import db from '../models/index';
import { Op } from 'sequelize';

let search = (q, type) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!q) {
                // return structured empty result for both
                if (type === 'both') {
                    resolve({ errCode: 0, errMessage: 'OK', data: { doctors: [], specialties: [] } });
                } else if (type === 'specialty') {
                    resolve({ errCode: 0, errMessage: 'OK', data: [] });
                } else {
                    resolve({ errCode: 0, errMessage: 'OK', data: [] });
                }
                return;
            }

            const keyword = `%${q}%`;

            // search specialties
            const specialtyQuery = async () => {
                return db.Specialty.findAll({
                    where: {
                        [Op.or]: [
                            { nameEn: { [Op.like]: keyword } },
                            { nameVi: { [Op.like]: keyword } },
                        ],
                    },
                    attributes: ['id', 'nameEn', 'nameVi'],
                });
            };

            // search doctors
            const doctorQuery = async () => {
                return db.User.findAll({
                    where: {
                        roleId: 'R2',
                        [Op.or]: [
                            { firstName: { [Op.like]: keyword } },
                            { lastName: { [Op.like]: keyword } },
                        ],
                    },
                    attributes: { exclude: ['password'] },
                    include: [
                        { model: db.Doctor_Infor, as: 'doctorInforData', include: [ { model: db.Specialty, as: 'specialtyData', attributes: ['id','nameEn','nameVi'] } ] },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn','valueVi'] }
                    ],
                    raw: true,
                    nest: true
                });
            };

            if (type === 'specialty') {
                let specialties = await specialtyQuery();
                resolve({ errCode: 0, errMessage: 'OK', data: specialties });
                return;
            }

            if (type === 'both') {
                const [doctors, specialties] = await Promise.all([doctorQuery(), specialtyQuery()]);
                resolve({ errCode: 0, errMessage: 'OK', data: { doctors, specialties } });
                return;
            }

            // default: doctor
            let doctors = await doctorQuery();
            resolve({ errCode: 0, errMessage: 'OK', data: doctors });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    search: search
};
