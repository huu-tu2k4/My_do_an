import nodemailer from 'nodemailer';
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.EMAIL_APP,
    pass: process.env.EMAIL_APP_PASSWORD,
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
            from: `"Admin Booking Care" <${process.env.EMAIL_APP}>`, // sender address
            to: dataSend.receiveEmail, // list of recipients
            subject: "Thông tin lịch khám", // subject line
            text: "", // plain text body
            html: getBodyHTMLEmailRemedy(dataSend, ''), // html body
        });
    } catch (err) {
        console.error("Error while sending mail:", err);
    }
}

let sendAttachment = async (dataSend) => {
    return new Promise(async (resolve, reject) => {
        try {
            let transporter = nodemailer.createTransport({
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
                    from: `"Admin Booking Care" <${process.env.EMAIL_APP}>`, // sender address
                    to: dataSend.email, // list of recipients
                    subject: "Thông tin hóa đơn", // subject line
                    text: "", // plain text body
                    html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'), // html body
                    attachments: [
                        {
                            filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`, //-${new Date().getTime()}
                            content: dataSend.imgBase64.split("base64,")[1],
                            encoding: 'base64'
                        }
                    ]
                });
            } catch (err) {
                console.error("Error while sending mail:", err);
            }
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
}

let getBodyHTMLEmailRemedy = (dataSend, type) => {
    let result = '';
    if(type === '') {
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
    }
    else if(type === 'Remedy') {
        if (dataSend.language === 'vi') {
            result = `
                <h3>Xin chào ${dataSend.patientName}!</h3>
                <p>Bạn nhận được email này vì đã khám thành công.</p>
                <p>Thông tin hóa đơn được gửi trong file đính kèm.</p>
                <p>Xin chân thành cảm ơn!</p>
            `
        }
        if (dataSend.language === 'en') {
            result = `
                <h3>Dear ${dataSend.patientName}!</h3>
                <p>You received this email because you have successfully completed the medical examination.</p>
                <p>Invoice information is sent in the attached file.</p>
                <p>Best regards!</p>
            `
        }
    }

    return result;
}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment,
    getBodyHTMLEmailRemedy: getBodyHTMLEmailRemedy
}