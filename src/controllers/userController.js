import db from "../models/index";
import userService from "../services/userService";

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password){
        return res.status(500).json({
            errCode: 1,
            message: 'Missing input parameter!'
        })
    }

    try {
        let userData = await userService.handleUserLogin(email, password);
        return res.status(200).json({
            errCode: userData.errCode,
            errMessage: userData.errMessage,
            user: userData.user ? userData.user : {}
        });
    } catch (error) {
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Server error',
        });
    }
}

let handleGetAllUsers = async (req, res) => {
    let id = req.query.id; // All, id
    let users = await userService.getAllUsers(id);

    if(!id){
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing input parameter!',
            users
        });
    }

    return res.status(200).json({
        errCode: 0,
        errMessage: 'OK',
        users
    });
}

let handleCreateNewUser = async (req, res) => {
    let message = await userService.createNewUser(req.body);
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.editUser(data);
    return res.status(200).json(message);
}

let handleDeleteUser = async (req, res) => {
    if(!req.body.id){
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required parameters!',
        });
    }
    let message = await userService.deleteUser(req.body.id);
    return res.status(200).json(message);
}

let getAllCode = async (req, res) => {
    try {
        let typeInput = req.query.type;
        let data = await userService.getAllCodeService(typeInput);
        return res.status(200).json(data);
    }
    catch (error) {
        console.log('Get all code error: ', error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        });
    }
}

module.exports = {
    handleLogin: handleLogin,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode

}