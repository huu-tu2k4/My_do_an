import searchService from '../services/searchService';

let search = async (req, res) => {
    try {
        const q = req.query.q || '';
        const type = req.query.type || 'doctor';
        let result = await searchService.search(q, type);
        return res.status(200).json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ errCode: -1, errMessage: 'Error from server ...' });
    }
}

module.exports = {
    search: search
};
