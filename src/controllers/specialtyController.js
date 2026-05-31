import specialtyService from '../services/specialtyService';

let createSpecialty = async (req, res) => {
    try {
        const response = await specialtyService.createSpecialty(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ 
            errCode: -1,
            errMessage: 'Error from the server...'
         });
    }
}

let getAllSpecialty = async (req, res) => {
    try {
        const q = req.query.q;
        const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const result = await specialtyService.getAllSpecialty(q, page, limit);
        return res.status(200).json({ errCode: 0, errMessage: 'OK', data: result.rows !== undefined ? result.rows : [], total: result.count !== undefined ? result.count : 0 });
    } catch (err) {
        res.status(500).json({ 
            errCode: -1,
            errMessage: 'Error from the server...'
         });
    }
}

let getDetailSpecialtyById = async (req, res) => {
    try {
        const response = await specialtyService.getDetailSpecialtyById(req.query.id, req.query.location);
        res.status(200).json(response);
    }
    catch (err) {
        res.status(500).json({ 
            errCode: -1,
            errMessage: 'Error from the server...'
         });
    }
}

let updateSpecialty = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await specialtyService.updateSpecialty(id, req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        if (response && response.errCode === 2) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ 
            errCode: -1,
            errMessage: 'Error from the server...'
         });
    }
}

module.exports = {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getDetailSpecialtyById: getDetailSpecialtyById,
    updateSpecialty: updateSpecialty
}