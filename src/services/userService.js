import { where } from "sequelize";
import db from "../models/index";
import bcrypt from 'bcryptjs';
import { raw } from "body-parser";

const salt = bcrypt.genSaltSync(10);

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if(isExist){
                let user = await db.User.findOne({
                    where: {email: email},
                    attributes: ['email', 'roleId', 'password', 'firstName', 'lastName']
                });
                if(user){
                    let check = await bcrypt.compareSync(password, user.password);
                    if(check){
                        userData.errCode = 0;
                        userData.errMessage = 'OK';
                        delete user.password;
                        userData.user = user;
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

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = '';
            if(userId === 'ALL'){
                user = await db.User.findAll({
                    attributes: {exclude: ['password']},
                    raw: true
                });
            }
            if(userId && userId !== 'ALL'){
                user = await db.User.findOne({
                    where: {id: userId},
                    attributes: {exclude: ['password']}
                });
            }
            resolve(user);
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
                    // phoneNumber: data.phoneNumber,
                    // gender: data.gender === 1 ? true : false,
                    // roleId: data.roleId
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
            if(!data.id){    //|| !data.firstName || !data.lastName || !data.email
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
                user.email = data.email;
                user.address = data.address;
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

module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    editUser: editUser,
    getAllCodeService: getAllCodeService
}