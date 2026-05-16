import patientService from '../services/patientService';
let postBookAppointment = async (req, res) => {
    try {
        let response = await patientService.postBookAppointment(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from the server...'
        })
    }
}
let postVerifyBookAppointment = async (req, res) => {
    try {
        let response = await patientService.postVerifyBookAppointment(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from the server...'
        })
    }
}
module.exports = {
    postVerifyBookAppointment: postVerifyBookAppointment,
    postBookAppointment: postBookAppointment
}