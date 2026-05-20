const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

import { GoogleGenerativeAI } from '@google/generative-ai';
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  systemInstruction: `Bạn là trợ lý y tế thông minh cho Booking Care - nền tảng đặt lịch khám bệnh uy tín tại Việt Nam. 
  Bạn chuyên phân tích triệu chứng và gợi ý chuyên khoa phù hợp.`
});

let generateContent = async (prompt) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!prompt) {
        resolve({
          errCode: 1,
          errMessage: 'Missing prompt'
        });
        return;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      resolve({
        errCode: 0,
        errMessage: 'OK',
        data: text
      });
    } catch (e) {
      console.error('Gemini API Error:', e);
      reject(e);
    }
  });
};

module.exports = {
  generateContent: generateContent
};