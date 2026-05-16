import db from "../models/index";
import userService from "../services/userService";

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password){
        return res.status(400).json({
            errCode: 1,
            message: 'Missing input parameter!'
        })
    }

    try {
        let userData = await userService.handleUserLogin(email, password);
        // set refresh token as HttpOnly cookie (if provided)
        if (userData && userData.refreshToken) {
            res.cookie('refreshToken', userData.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
        return res.status(200).json({
            errCode: userData.errCode,
            errMessage: userData.errMessage,
            user: userData.user ? userData.user : {},
            token: userData.token ? userData.token : null
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
    if (message && message.errCode === 1) {
        return res.status(400).json(message);
    }
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.editUser(data);
    if (message && message.errCode === 1) {
        return res.status(400).json(message);
    }
    return res.status(200).json(message);
}

let handleDeleteUser = async (req, res) => {
    if(!req.body.id){
        return res.status(400).json({
            errCode: 1,
            errMessage: 'Missing required parameters!',
        });
    }
    let message = await userService.deleteUser(req.body.id);
    if (message && message.errCode === 1) {
        return res.status(400).json(message);
    }
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
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server'
        });
    }
}

let handleRefreshToken = async (req, res) => {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ errCode: 1, errMessage: 'Missing refreshToken cookie' });
    }
    try {
        const result = await userService.verifyAndRefreshToken(refreshToken);
        if (result.errCode === 0) {
            return res.status(200).json({ errCode: 0, token: result.token });
        }
        return res.status(401).json(result);
    } catch (e) {
        return res.status(500).json({ errCode: -1, errMessage: 'Server error' });
    }
}
let handleLogout = async (req, res) => {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    try {
        if (refreshToken) {
            await userService.revokeRefreshToken(refreshToken);
        }
        // clear cookie
        res.clearCookie('refreshToken');
        return res.status(200).json({ errCode: 0 });
    } catch (e) {
        return res.status(500).json({ errCode: -1, errMessage: 'Server error' });
    }
}

module.exports = {
    handleLogin: handleLogin,
    handleRefreshToken: handleRefreshToken,
    handleLogout: handleLogout,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode

}