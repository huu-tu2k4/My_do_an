import { Op } from 'sequelize';
import db from "../models/index";
import ROLES from "../config/roles";
import bcrypt from 'bcryptjs';
import { raw } from "body-parser";
import jwt from 'jsonwebtoken';
import { addRefreshToken, removeRefreshToken, findByToken } from './tokenStore';

require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
const jwtExpire = process.env.JWT_EXPIRE;
const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE;

const salt = bcrypt.genSaltSync(10);

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if(isExist){
                let user = await db.User.findOne({
                    where: {email: email},
                    attributes: ['id', 'email', 'roleId', 'password', 'firstName', 'lastName', 'address', 'phoneNumber', 'image'],
                    include: [
                        {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi', 'keyMap']},
                        {model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi', 'keyMap']},
                    ]
                });
                if(user){
                    let check = await bcrypt.compare(password, user.password);
                    if(check){
                        userData.errCode = 0;
                        userData.errMessage = 'OK';
                        delete user.password;
                        userData.user = user;
                        delete userData.user.password;
                        try {
                            const payload = { id: user.id, email: user.email, roleId: user.roleId };
                            const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire });
                            // refresh token
                            const refreshToken = jwt.sign({ id: user.id }, jwtRefreshSecret, { expiresIn: jwtRefreshExpire });
                            // store refresh token in in-memory store for revocation support
                            const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
                            await addRefreshToken(refreshToken, user.id, expiresAt);
                            userData.token = token;
                            userData.refreshToken = refreshToken;
                        } catch (err) {
                            // ignore token error, still return user data
                        }
                    }
                    else{
                        userData.errCode = 3;
                        userData.errMessage = 'Wrong password!';
                    }
                }
                else{
                    userData.errCode = 2;
                    userData.errMessage = 'User not found!';
                }
            }
            else{
                userData.errCode = 1;
                userData.errMessage = 'Your email isn\'t exist in our system. Please try other email!';
            }
            
            resolve(userData);
        } catch (error) {
            reject(error);
        }
    });
}

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: {email: userEmail}
            });
            if(user){
                resolve(true);
            }
            else{
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    });

}

let getAllUsers = (userId, page, limit, q) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(userId === 'ALL'){
                // server-side pagination if page and limit provided
                if (page !== undefined && limit !== undefined) {
                    const offset = (page - 1) * limit;
                    const where = { roleId: { [Op.in]: [ROLES.ADMIN, ROLES.DOCTOR] } };
                    if (q && typeof q === 'string' && q.trim() !== '') {
                        const like = `%${q.trim()}%`;
                        where[Op.or] = [
                            { email: { [Op.iLike]: like } },
                            { firstName: { [Op.iLike]: like } },
                            { lastName: { [Op.iLike]: like } },
                            { phoneNumber: { [Op.iLike]: like } }
                        ];
                    }
                    const result = await db.User.findAndCountAll({
                        where,
                        attributes: {exclude: ['password']},
                        include: [
                            {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                            {model: db.Allcode, as: 'roleData', attributes: ['valueEn', 'valueVi']}
                        ],
                        order: [['createdAt', 'DESC']],
                        limit,
                        offset,
                        distinct: true
                    });
                    // result = { rows: [...], count: N }
                    resolve(result);
                } else {
                    // no pagination, return all
                    const where = { roleId: { [Op.in]: [ROLES.ADMIN, ROLES.DOCTOR] } };
                    if (q && typeof q === 'string' && q.trim() !== '') {
                        const like = `%${q.trim()}%`;
                        where[Op.or] = [
                            { email: { [Op.iLike]: like } },
                            { firstName: { [Op.iLike]: like } },
                            { lastName: { [Op.iLike]: like } },
                            { phoneNumber: { [Op.iLike]: like } }
                        ];
                    }
                    let users = await db.User.findAll({
                        where,
                        attributes: {exclude: ['password']},
                        include: [
                            {model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                            {model: db.Allcode, as: 'roleData', attributes: ['valueEn', 'valueVi']}
                        ],
                        order: [['createdAt', 'DESC']],
                        raw: true,
                        nest: true
                    });
                    resolve(users);
                }
            } else if(userId && userId !== 'ALL'){
                let user = await db.User.findOne({
                    where: {id: userId},
                    attributes: {exclude: ['password']}
                });
                resolve(user);
            } else {
                resolve([]);
            }
        }
        catch (error) {
            reject(error);
        }
    });
}

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        }
        catch(e) {
            reject(e);
        }
    });
}

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if(check === true) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email is already in used, please try another email!'
                })
            }
            else{
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar
                });
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                });
            }
        }
        catch (error) {
            reject(error);
        }
    });
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: {id: userId}
            });
            if(user){
                await db.User.destroy({
                    where: {id: userId}
                });
                resolve({
                    errCode: 0,
                    errMessage: 'User deleted successfully!'
                });
            }
            else{
                resolve({
                    errCode: 2,
                    errMessage: 'User not found!'
                });
            }

        }
        catch (error) {
            reject(error);
        }
    })
}

let editUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.id || !data.positionId || !data.roleId || !data.gender){    //|| !data.firstName || !data.lastName || !data.email
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                });
            }

            let user = await db.User.findOne({
                where: {id: data.id},
                raw: false
            });
            if(user){
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.roleId = data.roleId;
                user.positionId = data.positionId;
                user.gender = data.gender;
                user.phoneNumber = data.phoneNumber;
                if(data.avatar){
                    user.image = data.avatar;
                }
                await user.save();
                // await db.User.update({
                //     firstName: data.firstName,
                //     lastName: data.lastName,
                //     email: data.email
                //     // roleId: data.roleId,
                //     // positionId: data.positionId,
                //     // gender: data.gender
                // }, {
                //     where: {id: data.id}
                // });
                resolve({
                    errCode: 0,
                    errMessage: 'User updated successfully!'
                });
            }
            else{
                resolve({
                    errCode: 2,
                    errMessage: 'User not found!'
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                });
            }
            else{
                let res = {};
                let allcode = await db.Allcode.findAll(
                    {
                        where: {
                            type: typeInput
                        }
                    }
                );
                res.errCode = 0;
                res.errMessage = 'OK';
                res.data = allcode;
                resolve(res);
            }
            
        }
        catch (error) {
            reject(error);
        }
    })
}

let verifyAndRefreshToken = async (refreshToken) => {
    return new Promise(async (resolve, reject) => {
            try {
            const stored = await findByToken(refreshToken);
            if (!stored) {
                return resolve({ errCode: 1, errMessage: 'Refresh token not found' });
            }
            jwt.verify(refreshToken, jwtRefreshSecret, async (err, decoded) => {
                if (err) return resolve({ errCode: 1, errMessage: 'Invalid refresh token' });
                // create new access token
                const user = await db.User.findOne({ where: { id: decoded.id }, attributes: ['id','email','roleId'] });
                if (!user) return resolve({ errCode: 2, errMessage: 'User not found' });
                const payload = { id: user.id, email: user.email, roleId: user.roleId };
                const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire });
                resolve({ errCode: 0, token });
            });
        } catch (e) {
            reject(e);
        }
    });
}

let revokeRefreshToken = async (refreshToken) => {
    return new Promise(async (resolve) => {
        try {
            const removed = await removeRefreshToken(refreshToken);
            resolve({ errCode: 0, removed });
        } catch (e) {
            resolve({ errCode: 1, errMessage: 'Error revoking' });
        }
    });
}

module.exports = {
    handleUserLogin: handleUserLogin,
    verifyAndRefreshToken: verifyAndRefreshToken,
    revokeRefreshToken: revokeRefreshToken,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    editUser: editUser,
    getAllCodeService: getAllCodeService
}