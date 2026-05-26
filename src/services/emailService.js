import { Resend } from 'resend';
require('dotenv').config();

const maskKey = (key) => {
    if (!key) return '<<missing>>';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

console.log('[emailService] initializing', {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    PORT: process.env.PORT || 'unknown'
});

const hasResendKey = !!process.env.RESEND_API_KEY;
console.log('[emailService] RESEND_API_KEY present:', hasResendKey, 'masked:', maskKey(process.env.RESEND_API_KEY));
if (!hasResendKey) console.warn('[emailService] Warning: RESEND_API_KEY is missing - emails will fail');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendSimpleEmail = async (dataSend) => {
    try {
        const preview = {
            to: dataSend?.receiveEmail,
            subject: dataSend?.subject || 'Thông tin lịch khám',
            language: dataSend?.language,
            time: dataSend?.time,
            doctorName: dataSend?.doctorName,
            hasRedirectLink: !!dataSend?.redirectLink,
            htmlLength: (getBodyHTMLEmailRemedy(dataSend, '') || '').length,
        };
        console.log('[sendSimpleEmail] sending email preview:', preview);

        const { data, error } = await resend.emails.send({
            from: 'Admin Booking Care', // Thay bằng email bạn verify trên Resend
            to: dataSend.receiveEmail,
            subject: dataSend.subject || "Thông tin lịch khám",
            html: getBodyHTMLEmailRemedy(dataSend, ''),
        });

        if (error) {
            console.error('[sendSimpleEmail] Resend returned error:', error);
            throw error;
        }

        console.log('[sendSimpleEmail] ✅ Email sent successfully, id:', data?.id, 'raw:', data);
        return data;
    } catch (err) {
        console.error('[sendSimpleEmail] Error while sending mail:', err?.message || err, err);
        throw err;
    }
};

const sendAttachment = async (dataSend) => {
    try {
        const imgBase64 = dataSend?.imgBase64 || '';
        const base64Part = imgBase64.split('base64,')[1] || imgBase64;
        let attachmentSize = 0;
        try {
            // approximate size in bytes
            attachmentSize = Math.ceil((base64Part.length * 3) / 4);
        } catch (e) {
            attachmentSize = 0;
        }

        console.log('[sendAttachment] preparing to send attachment to:', dataSend?.email, 'patientId:', dataSend?.patientId, 'attachmentBytesApprox:', attachmentSize);

        const filename = `remedy-${dataSend.patientId}-${new Date().getTime()}.png`;

        const { data, error } = await resend.emails.send({
            from: 'Admin Booking Care',
            to: dataSend.email,
            subject: dataSend.subject || "Thông tin hóa đơn",
            html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
            attachments: [
                {
                    filename,
                    content: base64Part,
                    encoding: 'base64'
                }
            ]
        });

        if (error) {
            console.error('[sendAttachment] Resend returned error:', error);
            throw error;
        }

        console.log('[sendAttachment] ✅ Attachment email sent successfully, id:', data?.id, 'raw:', data);
        return data;
    } catch (err) {
        console.error('[sendAttachment] Error while sending mail:', err?.message || err, err);
        throw err;
    }
};

let getBodyHTMLEmailRemedy = (dataSend, type) => {
    console.log('[getBodyHTMLEmailRemedy] building body, type:', type, 'language:', dataSend?.language);
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