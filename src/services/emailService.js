import { Resend } from 'resend';
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendSimpleEmail = async (dataSend) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Admin Booking Care <onboarding@resend.dev>', // Thay bằng email bạn verify trên Resend
            to: dataSend.receiveEmail,
            subject: "Thông tin lịch khám",
            html: getBodyHTMLEmailRemedy(dataSend, ''),
        });

        if (error) {
            console.error("Resend Error:", error);
            throw error;
        }

        console.log('✅ Email sent successfully:', data.id);
        return data;
    } catch (err) {
        console.error("Error while sending mail (sendSimpleEmail):", err);
        throw err;
    }
};

const sendAttachment = async (dataSend) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Admin Booking Care <onboarding@resend.dev>',
            to: dataSend.email,
            subject: "Thông tin hóa đơn",
            html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
            attachments: [
                {
                    filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                    content: dataSend.imgBase64.split("base64,")[1],
                    encoding: 'base64'
                }
            ]
        });

        if (error) {
            console.error("Resend Error:", error);
            throw error;
        }

        console.log('✅ Attachment email sent successfully:', data.id);
        return data;
    } catch (err) {
        console.error("Error while sending mail (sendAttachment):", err);
        throw err;
    }
};

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
            `;
        }
    } else if (type === 'Remedy') {
        if (dataSend.language === 'vi') {
            result = `
                <h3>Xin chào ${dataSend.patientName}!</h3>
                <p>Bạn nhận được email này vì đã khám thành công.</p>
                <p>Thông tin hóa đơn được gửi trong file đính kèm.</p>
                <p>Xin chân thành cảm ơn!</p>
            `;
        } else if (dataSend.language === 'en') {
            result = `
                <h3>Dear ${dataSend.patientName}!</h3>
                <p>You received this email because you have successfully completed the medical examination.</p>
                <p>Invoice information is sent in the attached file.</p>
                <p>Best regards!</p>
            `;
        }
    }
    return result;
};

module.exports = {
    sendSimpleEmail,
    sendAttachment,
    getBodyHTMLEmailRemedy
};