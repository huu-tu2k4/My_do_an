import symptomService from '../services/symptomService.js';
let suggestSpecialty = async (req, res) => {
    try {
        let result = await symptomService.suggestSpecialty(req.body.symptoms);

        res.status(200).json(result);
    } catch (error) {
        console.error('Symptom Controller Error:', error);

        let statusCode = error.message.includes('Vui lòng nhập') ? 400 : 500;

        res.status(statusCode).json({
            errCode: -1,
            message: error.message || 'Error from the server'
        });
    }
}

module.exports = {
    suggestSpecialty: suggestSpecialty
}