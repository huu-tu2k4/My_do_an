import nodemailer from 'nodemailer';
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

let sendSimpleEmail = async (dataSend) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
        auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });
    try {
        const info = await transporter.sendMail({
            from: '"Test Send To Email" <zzanhtu98zz@gmail.com>', // sender address
            to: dataSend.receiveEmail, // list of recipients
            subject: "Thông tin lịch khám", // subject line
            text: "", // plain text body
            html: getBodyHTMLEmailRemedy(dataSend), // html body
        });
    } catch (err) {
        console.error("Error while sending mail:", err);
    }
}

let getBodyHTMLEmailRemedy = (dataSend) => {
    let result = '';
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
        `
    }
    if (dataSend.language === 'en') {
        result = `
            <h3>Dear ${dataSend.patientName}!</h3>
            <p>You received this email because you successfully booked an appointment on our system.</p>
            <p>Information about the appointment:</p>
            <ul>
                <li>Time: ${dataSend.time}</li>
                <li>Doctor: ${dataSend.doctorName}</li>
            </ul>
            <div>Please click the link below to confirm and complete the appointment booking process.</div>
            <a href="${dataSend.redirectLink}" target="_blank">Confirm Appointment</a>
            <p>Best regards!</p>
        `
    }
    return result;
}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    getBodyHTMLEmailRemedy: getBodyHTMLEmailRemedy
}