import handbookService from '../services/handbookService';

let createCategory = async (req, res) => {
    try {
        const response = await handbookService.createCategory(req.body);
        if (response && response.errCode === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ errCode: -1, errMessage: 'Error from the server...' });
    }
}

let getAllCategories = async (req, res) => {
    try {
        const q = req.query.q;
        const response = await handbookService.getAllCategories(q);
        res.status(200).json(response);
    } catch (err) {
        console.error('getAllCategories error:', err && err.stack ? err.stack : err);
        res.status(500).json({ errCode: -1, errMessage: err && err.message ? err.message : 'Error from the server...' });
    }
}

let getCategoryById = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await handbookService.getCategoryById(id);
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ errCode: -1, errMessage: 'Error from the server...' });
    }
}

let updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await handbookService.updateCategory(id, req.body);
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

let deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await handbookService.deleteCategory(id);
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
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
}
