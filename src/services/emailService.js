import nodemailer from 'nodemailer';
require('dotenv').config();

// Tạo transporter 1 lần duy nhất (tốt hơn)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.EMAIL_APP,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false // Quan trọng khi deploy trên Render
    },
    // Thêm timeout để tránh lỗi ETIMEDOUT
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,           // Tái sử dụng connection
    maxConnections: 5,
    maxMessages: 10
});

let sendSimpleEmail = async (dataSend) => {
    try {
        const info = await transporter.sendMail({
            from: `"Admin Booking Care" <${process.env.EMAIL_APP}>`,
            to: dataSend.receiveEmail,
            subject: "Thông tin lịch khám",
            text: "",
            html: getBodyHTMLEmailRemedy(dataSend, ''),
        });
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (err) {
        console.error("Error while sending mail (sendSimpleEmail):", err);
        throw err; // Ném lỗi để xử lý bên ngoài nếu cần
    }
}

let sendAttachment = async (dataSend) => {
    return new Promise(async (resolve, reject) => {
        try {
            const info = await transporter.sendMail({
                from: `"Admin Booking Care" <${process.env.EMAIL_APP}>`,
                to: dataSend.email,
                subject: "Thông tin hóa đơn",
                text: "",
                html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
                attachments: [
                    {
                        filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                        content: dataSend.imgBase64.split("base64,")[1],
                        encoding: 'base64'
                    }
                ]
            });
            console.log('Attachment email sent successfully:', info.messageId);
            resolve(info);
        } catch (err) {
            console.error("Error while sending mail (sendAttachment):", err);
            reject(err);
        }
    });
}

let getBodyHTMLEmailRemedy = (dataSend, type) => {
    let result = '';
    if (type === '') {
        if (dataSend.language === 'vi') {
            result = `
                <h3>Xin chào ${dataSend.patientName}!</h3>
                <p>Bạn nhận được email này vì đã đặt lịch khám thành công trên hệ thống của chúng tôi.</p>
                <p>Thông tin lịch khám bệnh:</p>
                <ul>
                    <li>Thời gian: ${dataSend.time}</li>
                    <li>Bác sĩ: ${dataSend.doctorName}</li>
                </ul>
                <div>Vui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh.</div>
                <a href="${dataSend.redirectLink}" target="_blank">Xác nhận lịch khám</a>
                <p>Xin chân thành cảm ơn!</p>
            `;
        } else if (dataSend.language === 'en') {
            // ... (giữ nguyên phần tiếng Anh)
        }
    } else if (type === 'Remedy') {
        // ... (giữ nguyên phần Remedy)
    }
    return result;
}

module.exports = {
    sendSimpleEmail,
    sendAttachment,
    getBodyHTMLEmailRemedy
};