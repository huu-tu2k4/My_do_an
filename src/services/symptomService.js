import aiService from './aiService';

let suggestSpecialty = async (symptoms) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!symptoms || symptoms.trim().length < 5) {
                resolve({
                    errCode: 1,
                    errMessage: 'Vui lòng nhập triệu chứng rõ ràng'
                });
                return;
            }

            const prompt = `
            Người dùng mô tả triệu chứng: "${symptoms}"

            Hãy phân tích và gợi ý 1 chuyên khoa phù hợp nhất.
            Trả về **chỉ JSON** theo đúng định dạng sau, không thêm bất kỳ ký tự nào khác:

            {
            "suggestedSpecialties": [
                {
                "name": "Tên chuyên khoa",
                "reason": "Lý do gợi ý ngắn gọn, dễ hiểu",
                "urgency": "cao" | "trung bình" | "thấp"
                }
            ],
            "advice": "Lời khuyên ngắn gọn cho người dùng bằng tiếng Việt"
            }`;

            const geminiResponse = await aiService.generateContent(prompt);

            if (geminiResponse.errCode !== 0) {
                resolve(geminiResponse);
                return;
            }

            let cleaned = geminiResponse.data.trim();
            cleaned = cleaned.replace(/```json|```/g, '').trim();

            const result = JSON.parse(cleaned);

            resolve({
                errCode: 0,
                errMessage: 'OK',
                data: result
            });

        } catch (e) {
            console.error('Symptom Service Error:', e);
            if (e.message.includes('JSON')) {
                resolve({
                    errCode: 2,
                    errMessage: 'Không thể phân tích kết quả từ AI'
                });
            } else {
                reject(e);
            }
        }
    });
};

module.exports = {
    suggestSpecialty: suggestSpecialty
};