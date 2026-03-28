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

module.exports = {
    handleLogin: handleLogin,
}