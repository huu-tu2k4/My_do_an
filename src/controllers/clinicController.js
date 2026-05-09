import clinicService from '../services/clinicService';

let createClinic = async (req, res) => {
    try {
        let info = await clinicService.createClinic(req.body);
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            message: 'Error from the server'
        });
    }
};

let getAllClinic = async (req, res) => {
    try {
        let clinics = await clinicService.getAllClinic();
        return res.status(200).json(clinics);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            message: 'Error from the server'
        });
    }
};

let getDetailClinicById = async (req, res) => {
    try {
        let info = await clinicService.getDetailClinicById(req.query.id);
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            message: 'Error from the server'
        });
    }
};

module.exports = {
    createClinic: createClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById
}