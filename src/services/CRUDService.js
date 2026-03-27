import { where } from 'sequelize';
import db from '../models/index';
import bcrypt from 'bcryptjs'
const salt = bcrypt.genSaltSync(10);

let getAllUsers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.User.findAll({
                raw: true,
            });
            resolve(data);
        }
        catch(e) {
            reject(e);
        }
    })
}

let createNewUser = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPasswordFromBcrypt = await hashUserPassword(data.password);
            await db.User.create({
                email: data.email,
                password: hashPasswordFromBcrypt,
                firstName: data.firstName,
                lastName: data.lastName,
                address: data.address,
                phoneNumber: data.phoneNumber,
                gender: data.gender === 1 ? true : false,
                roleId: data.roleId
            });
            resolve('ok create new user success!');
        }
        catch(e) {
            reject(e)
        }
    })
    
    
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

let displayUserId = (id) => {
    return new Promise( async (resolve, reject) => {
        try {
            let dataUserId = await db.User.findOne(
                {
                where: {id: id},
                 raw: true
                }
            );
            if(dataUserId){
                resolve(dataUserId);
            }
            else{
                resolve({});
            }
            
        }
        catch(e) {
            reject(e);
        }
    })
}

let updateUser = async (data) => {
    return new Promise( async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: {id: data.id},
            });
            if(user){
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;                
                await user.save();
                let allUsers = await db.User.findAll();
                resolve(allUsers);
            }
            else{
                resolve();
            }
        }
        catch(e) {
            reject(e);
        }
    })
}

let deleteUserById = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({ where: { id: userId } });
            if(user){
                await user.destroy();
            }
            resolve();
        }
        catch(e) {
            reject(e);
        }
    })
}

module.exports = {
    createNewUser: createNewUser,
    getAllUsers: getAllUsers,
    displayUserId: displayUserId,
    updateUser: updateUser,
    deleteUserById: deleteUserById,
}
