import clinicService from '../services/clinicService';

let createClinic = async (req, res) => {
    try {
        let info = await clinicService.createClinic(req.body);
        if (info && info.errCode === 1) {
            return res.status(400).json(info);
        }
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
        const q = req.query.q;
        const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const result = await clinicService.getAllClinic(q, page, limit);
        return res.status(200).json({ errCode: 0, errMessage: 'OK', data: result.rows !== undefined ? result.rows : [], total: result.count !== undefined ? result.count : 0 });
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

let updateClinic = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await clinicService.updateClinic(id, req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        if (response && response.errCode === 2) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ errCode: -1, errMessage: 'Error from the server...' });
    }
}

module.exports = {
    createClinic: createClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById,
    updateClinic: updateClinic
}