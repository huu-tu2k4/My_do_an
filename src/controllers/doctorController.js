import doctorService from "../services/doctorService";
let getTopDoctorHome = async (req, res) => {
    let limit = req.query.limit;
    if(!limit){
        limit = 10;
    }
    try {
        let doctors = await doctorService.getTopDoctorHome(+limit);
        return res.status(200).json(doctors);
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getAllDoctors = async (req, res) => {
    try {
        const q = req.query.q;
        const doctors = await doctorService.getAllDoctors(q);
        return res.status(200).json(doctors);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let postInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.postInforDoctor(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getDetailDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getDetailDoctorById(req.query.id);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let bulkCreateSchedule = async (req, res) => {
    try {
        let response = await doctorService.bulkCreateSchedule(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let editBulkSchedule = async (req, res) => {
    try {
        let response = await doctorService.editBulkSchedule(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getScheduleByDate = async (req, res) => {
    try {
        let infor = await doctorService.getScheduleByDateService(req.query.doctorId, req.query.date);
        return res.status(200).json(infor);
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getExtraInforDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getExtraInforDoctorById(req.query.doctorId);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getProfileDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getProfileDoctorById(req.query.doctorId);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let getListPatientForDoctor = async (req, res) => {
    try {
        let infor = await doctorService.getListPatientForDoctor(req.query.doctorId, req.query.date);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let sendRemedy = async (req, res) => {
    try {
        let infor = await doctorService.sendRemedy(req.body);
        if (infor && infor.errCode === 1) {
            return res.status(400).json(infor);
        }
        return res.status(200).json(infor);
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

let cancelAppointment = async (req, res) => {
    try {
        let infor = await doctorService.cancelAppointment(req.body);
        if (infor && infor.errCode === 1) {
            return res.status(400).json(infor);
        }
        return res.status(200).json(infor);
    }
    catch (e) {
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server ...'
        })
    }
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    editBulkSchedule: editBulkSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy,
    cancelAppointment: cancelAppointment
}