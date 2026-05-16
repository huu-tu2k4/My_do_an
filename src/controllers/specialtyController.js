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
        const response = await specialtyService.getAllSpecialty();
        res.status(200).json(response);
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

module.exports = {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getDetailSpecialtyById: getDetailSpecialtyById
}