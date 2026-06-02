
// const SibApiV3Sdk = require('@sendinblue/client');
// require('dotenv').config();
// const nodemailer = require('nodemailer');

// const maskKey = (key) => {
//     if (!key) return '<<missing>>';
//     if (key.length <= 8) return '****';
//     return `${key.slice(0, 4)}...${key.slice(-4)}`;
// };

// console.log('[emailService] initializing', {
//     NODE_ENV: process.env.NODE_ENV || 'unknown',
//     PORT: process.env.PORT || 'unknown'
// });

// // Brevo Setup
// const brevoKey = process.env.SENDINBLUE_API_KEY || process.env.BREVO_API_KEY || '';
// const hasBrevoKey = !!brevoKey;
// console.log('[emailService] BREVO key present:', hasBrevoKey, 'masked:', maskKey(brevoKey));
// if (!hasBrevoKey) console.warn('[emailService] Warning: BREVO_API_KEY is missing');

// let brevoClient = null;
// if (hasBrevoKey) {
//     try {
//         const defaultClient = SibApiV3Sdk.ApiClient.instance;
//         const apiKeyAuth = defaultClient.authentications['api-key'];
//         apiKeyAuth.apiKey = brevoKey;
//         brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
//         console.log('[emailService] Brevo client initialized successfully');
//     } catch (err) {
//         console.error('[emailService] Failed to initialize Brevo client', err?.message);
//         brevoClient = null;
//     }
// }

// // Nodemailer / SMTP setup
// const smtpHost = process.env.SMTP_HOST || '';
// const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
// const smtpSecure = process.env.SMTP_SECURE === 'true';
// const smtpUser = process.env.SMTP_USER || '';
// const smtpPass = process.env.SMTP_PASS || '';
// const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);
// if (!hasSmtp) console.warn('[emailService] Warning: SMTP credentials missing');

// let transporter = null;
// if (hasSmtp) {
//     transporter = nodemailer.createTransport({
//         host: smtpHost,
//         port: smtpPort,
//         secure: smtpSecure,
//         auth: { user: smtpUser, pass: smtpPass }
//     });
//     transporter.verify().catch(err => console.warn('[emailService] SMTP verify failed:', err?.message));
// }

// // Provider
// const emailProvider = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase();
// console.log('[emailService] EMAIL_PROVIDER:', emailProvider);

// // From field
// const fromEmail = process.env.EMAIL_APP || process.env.FROM_EMAIL || '';
// const fromName = process.env.EMAIL_FROM_NAME || 'Admin Booking Care';
// const fromField = fromEmail && fromEmail.includes('@') 
//     ? `${fromName} <${fromEmail}>` 
//     : `${fromName} <no-reply@example.com>`;

// console.log('[emailService] FROM field:', maskKey(fromField));

// // ====================== SEND VIA BREVO ======================
// const sendViaBrevo = async (dataSend, type = '') => {
//     if (!brevoClient) throw new Error('Brevo client not configured');
    
//     const html = getBodyHTMLEmailRemedy(dataSend, type);
//     const toEmail = dataSend.receiveEmail || dataSend.email;
//     const senderEmail = fromEmail || 'no-reply@example.com';

//     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
//         sender: { name: fromName, email: senderEmail },
//         to: [{ email: toEmail }],
//         subject: dataSend.subject || (type === 'Remedy' ? "Thông tin hóa đơn" : "Thông tin lịch khám"),
//         htmlContent: html,
//     });

//     const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
//     return result;
// };

// // ====================== SEND VIA SMTP ======================
// const sendViaNodemailer = async (dataSend, type = '') => {
//     if (!transporter) throw new Error('SMTP transporter not configured');
//     const html = getBodyHTMLEmailRemedy(dataSend, type);
    
//     const mailOptions = {
//         from: fromField,
//         to: dataSend.receiveEmail || dataSend.email,
//         subject: dataSend.subject || (type === 'Remedy' ? "Thông tin hóa đơn" : "Thông tin lịch khám"),
//         html: html,
//     };
//     return await transporter.sendMail(mailOptions);
// };

// // ====================== MAIN FUNCTIONS ======================
// const sendSimpleEmail = async (dataSend) => {
//     const emailType = dataSend?.type || '';
//     // ... (phần preview log giữ nguyên)

//     if (emailProvider === 'brevo' || emailProvider === 'sendinblue') {
//         if (!hasBrevoKey) throw new Error('Brevo selected but API key missing');
//         const result = await sendViaBrevo(dataSend, emailType);
//         console.log('[sendSimpleEmail] ✅ Brevo sent successfully');
//         return result;
//     }

//     if (emailProvider === 'smtp') {
//         if (!hasSmtp) throw new Error('SMTP selected but credentials missing');
//         const result = await sendViaNodemailer(dataSend, emailType);
//         console.log('[sendSimpleEmail] ✅ SMTP sent');
//         return result;
//     }

//     // AUTO mode: ưu tiên Brevo → fallback SMTP
//     if (emailProvider === 'auto') {
//         if (hasBrevoKey && brevoClient) {
//             try {
//                 const result = await sendViaBrevo(dataSend, emailType);
//                 console.log('[sendSimpleEmail] ✅ Brevo sent');
//                 return result;
//             } catch (err) {
//                 console.warn('[sendSimpleEmail] Brevo failed, trying SMTP fallback:', err?.message);
//                 if (hasSmtp) {
//                     return await sendViaNodemailer(dataSend, emailType);
//                 }
//                 throw err;
//             }
//         }

//         if (hasSmtp) {
//             return await sendViaNodemailer(dataSend, emailType);
//         }

//         throw new Error('No email provider configured (Brevo or SMTP)');
//     }

//     throw new Error(`Unknown EMAIL_PROVIDER: ${emailProvider}`);
// };

// // ====================== SEND ATTACHMENT (ĐÃ SỬA) ======================
// const sendAttachment = async (dataSend) => {
//     const imgBase64 = dataSend?.imgBase64 || '';
//     const base64Part = imgBase64.split('base64,')[1] || imgBase64;
//     const filename = `remedy-${dataSend.patientId || 'unknown'}-${Date.now()}.png`;

//     console.log('[sendAttachment] Sending to:', dataSend.email || dataSend.receiveEmail);

//     if (emailProvider === 'brevo' || emailProvider === 'sendinblue') {
//         if (!hasBrevoKey) throw new Error('Brevo API key missing');
        
//         const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
//             sender: { name: fromName, email: fromEmail || 'no-reply@example.com' },
//             to: [{ email: dataSend.email || dataSend.receiveEmail }],
//             subject: dataSend.subject || "Thông tin hóa đơn",
//             htmlContent: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
//             attachment: [{
//                 name: filename,
//                 content: base64Part,
//                 contentType: 'image/png'
//             }]
//         });

//         const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
//         console.log('[sendAttachment] ✅ Brevo with attachment sent');
//         return result;
//     }

//     if (emailProvider === 'smtp') {
//         if (!hasSmtp) throw new Error('SMTP credentials missing');
//         // ... giữ nguyên code SMTP attachment cũ của bạn
//         const mailOptions = {
//             from: fromField,
//             to: dataSend.email || dataSend.receiveEmail,
//             subject: dataSend.subject || "Thông tin hóa đơn",
//             html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
//             attachments: [{ filename, content: base64Part, encoding: 'base64' }]
//         };
//         return await transporter.sendMail(mailOptions);
//     }

//     // Auto mode
//     if (emailProvider === 'auto') {
//         if (hasBrevoKey && brevoClient) {
//             try {
//                 // dùng code Brevo attachment ở trên
//                 const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({ /* ... */ });
//                 return await brevoClient.sendTransacEmail(sendSmtpEmail);
//             } catch (err) {
//                 console.warn('Brevo attachment failed, trying SMTP');
//                 if (hasSmtp) {
//                     // SMTP code
//                 }
//             }
//         }
//         // Fallback SMTP nếu không có Brevo
//         if (hasSmtp && transporter) {
//             const mailOptions = {
//                 from: fromField,
//                 to: dataSend.email || dataSend.receiveEmail,
//                 subject: dataSend.subject || "Thông tin hóa đơn",
//                 html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
//                 attachments: [{
//                     filename: filename,
//                     content: base64Part,
//                     encoding: 'base64'
//                 }]
//             };
//             const info = await transporter.sendMail(mailOptions);
//             console.log('[sendAttachment] ✅ SMTP (auto) with attachment sent');
//             return info;
//         }

//         throw new Error('No email provider configured for attachment (Brevo or SMTP)');
//     }

//     throw new Error(`Unknown EMAIL_PROVIDER value: ${emailProvider}`);
// };


// const getBodyHTMLEmailRemedy = (dataSend, type) => {
//     console.log('[getBodyHTMLEmailRemedy] building body, type:', type, 'language:', dataSend?.language);
//     let result = '';
//         if (type === '' || type === 'Booking') {
//         if (dataSend.language === 'vi') {
//             result = `
//                 <h3>Xin chào ${dataSend.patientName}!</h3>
//                 <p>Bạn nhận được email này vì đã đặt lịch khám thành công trên hệ thống của chúng tôi.</p>
//                 <p>Thông tin lịch khám bệnh:</p>
//                 <ul>
//                     <li>Thời gian: ${dataSend.time}</li>
//                     <li>Bác sĩ: ${dataSend.doctorName}</li>
//                 </ul>
//                 <div>Vui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh.</div>
//                 <a href="${dataSend.redirectLink}" target="_blank">Xác nhận lịch khám</a>
//                 <p>Xin chân thành cảm ơn!</p>
//             `;
//         } else if (dataSend.language === 'en') {
//             result = `
//                 <h3>Dear ${dataSend.patientName}!</h3>
//                 <p>You received this email because you successfully booked an appointment on our system.</p>
//                 <p>Information about the appointment:</p>
//                 <ul>
//                     <li>Time: ${dataSend.time}</li>
//                     <li>Doctor: ${dataSend.doctorName}</li>
//                 </ul>
//                 <div>Please click the link below to confirm and complete the appointment booking process.</div>
//                 <a href="${dataSend.redirectLink}" target="_blank">Confirm Appointment</a>
//                 <p>Best regards!</p>
//             `;
//         }
//     } else if (type === 'Remedy') {
//         if (dataSend.language === 'vi') {
//             result = `
//                 <h3>Xin chào ${dataSend.patientName}!</h3>
//                 <p>Bạn nhận được email này vì đã khám thành công.</p>
//                 <p>Thông tin hóa đơn được gửi trong file đính kèm.</p>
//                 <p>Xin chân thành cảm ơn!</p>
//             `;
//         } else if (dataSend.language === 'en') {
//             result = `
//                 <h3>Dear ${dataSend.patientName}!</h3>
//                 <p>You received this email because you have successfully completed the medical examination.</p>
//                 <p>Invoice information is sent in the attached file.</p>
//                 <p>Best regards!</p>
//             `;
//         }
//     } else if (type === 'Cancel') {
//         // Cancellation email body
//         const reasonText = dataSend.cancelReason ? (dataSend.language === 'vi' ? `Lý do: ${dataSend.cancelReason}` : `Reason: ${dataSend.cancelReason}`) : '';
//         if (dataSend.language === 'vi') {
//             result = `
//                 <h3>Xin chào ${dataSend.patientName}!</h3>
//                 <p>Rất tiếc, lịch khám của bạn đã bị hủy bởi bác sĩ.</p>
//                 <p>Thông tin lịch hủy:</p>
//                 <ul>
//                     <li>Thời gian: ${dataSend.timeString}</li>
//                     <li>Bác sĩ: ${dataSend.doctorName}</li>
//                 </ul>
//                 <p>${reasonText}</p>
//                 <p>Vui lòng liên hệ phòng khám để sắp xếp lại lịch khám nếu cần.</p>
//                 <p>Xin chân thành cảm ơn!</p>
//             `;
//         } else {
//             result = `
//                 <h3>Dear ${dataSend.patientName}!</h3>
//                 <p>We are sorry to inform you that your appointment has been cancelled by the doctor.</p>
//                 <p>Cancellation details:</p>
//                 <ul>
//                     <li>Time: ${dataSend.timeString}</li>
//                     <li>Doctor: ${dataSend.doctorName}</li>
//                 </ul>
//                 <p>${reasonText}</p>
//                 <p>Please contact the clinic to reschedule if needed.</p>
//                 <p>Best regards!</p>
//             `;
//         }
//     }
//     return result;
// };


// module.exports = { sendSimpleEmail, sendAttachment, getBodyHTMLEmailRemedy };

    // console.log('[getBodyHTMLEmailRemedy] building body, type:', type, 'language:', dataSend?.language);
    // let result = '';
    //     if (type === '' || type === 'Booking') {
    //     if (dataSend.language === 'vi') {
    //         result = `
    //             <h3>Xin chào ${dataSend.patientName}!</h3>
    //             <p>Bạn nhận được email này vì đã đặt lịch khám thành công trên hệ thống của chúng tôi.</p>
    //             <p>Thông tin lịch khám bệnh:</p>
    //             <ul>
    //                 <li>Thời gian: ${dataSend.time}</li>
    //                 <li>Bác sĩ: ${dataSend.doctorName}</li>
    //             </ul>
    //             <div>Vui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh.</div>
    //             <a href="${dataSend.redirectLink}" target="_blank">Xác nhận lịch khám</a>
    //             <p>Xin chân thành cảm ơn!</p>
    //         `;
    //     } else if (dataSend.language === 'en') {
    //         result = `
    //             <h3>Dear ${dataSend.patientName}!</h3>
    //             <p>You received this email because you successfully booked an appointment on our system.</p>
    //             <p>Information about the appointment:</p>
    //             <ul>
    //                 <li>Time: ${dataSend.time}</li>
    //                 <li>Doctor: ${dataSend.doctorName}</li>
    //             </ul>
    //             <div>Please click the link below to confirm and complete the appointment booking process.</div>
    //             <a href="${dataSend.redirectLink}" target="_blank">Confirm Appointment</a>
    //             <p>Best regards!</p>
    //         `;
    //     }
    // } else if (type === 'Remedy') {
    //     if (dataSend.language === 'vi') {
    //         result = `
    //             <h3>Xin chào ${dataSend.patientName}!</h3>
    //             <p>Bạn nhận được email này vì đã khám thành công.</p>
    //             <p>Thông tin hóa đơn được gửi trong file đính kèm.</p>
    //             <p>Xin chân thành cảm ơn!</p>
    //         `;
    //     } else if (dataSend.language === 'en') {
    //         result = `
    //             <h3>Dear ${dataSend.patientName}!</h3>
    //             <p>You received this email because you have successfully completed the medical examination.</p>
    //             <p>Invoice information is sent in the attached file.</p>
    //             <p>Best regards!</p>
    //         `;
    //     }
    // } else if (type === 'Cancel') {
    //     // Cancellation email body
    //     const reasonText = dataSend.cancelReason ? (dataSend.language === 'vi' ? `Lý do: ${dataSend.cancelReason}` : `Reason: ${dataSend.cancelReason}`) : '';
    //     if (dataSend.language === 'vi') {
    //         result = `
    //             <h3>Xin chào ${dataSend.patientName}!</h3>
    //             <p>Rất tiếc, lịch khám của bạn đã bị hủy bởi bác sĩ.</p>
    //             <p>Thông tin lịch hủy:</p>
    //             <ul>
    //                 <li>Thời gian: ${dataSend.timeString}</li>
    //                 <li>Bác sĩ: ${dataSend.doctorName}</li>
    //             </ul>
    //             <p>${reasonText}</p>
    //             <p>Vui lòng liên hệ phòng khám để sắp xếp lại lịch khám nếu cần.</p>
    //             <p>Xin chân thành cảm ơn!</p>
    //         `;
    //     } else {
    //         result = `
    //             <h3>Dear ${dataSend.patientName}!</h3>
    //             <p>We are sorry to inform you that your appointment has been cancelled by the doctor.</p>
    //             <p>Cancellation details:</p>
    //             <ul>
    //                 <li>Time: ${dataSend.timeString}</li>
    //                 <li>Doctor: ${dataSend.doctorName}</li>
    //             </ul>
    //             <p>${reasonText}</p>
    //             <p>Please contact the clinic to reschedule if needed.</p>
    //             <p>Best regards!</p>
    //         `;
    //     }
    // }
    // return result;
const Brevo = require('@getbrevo/brevo');
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('[emailService] Initializing...');

// ==================== BREVO SETUP ====================
const brevoApiKey = process.env.BREVO_API_KEY?.trim() || '';
let transactionalApi = null;

if (brevoApiKey) {
    try {
        transactionalApi = new Brevo.TransactionalEmailsApi();
        transactionalApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
        
        console.log('[emailService] ✅ Brevo API initialized successfully (v2)');
    } catch (err) {
        console.error('[emailService] ❌ Failed to initialize Brevo:', err.message);
    }
} else {
    console.warn('[emailService] ⚠️ BREVO_API_KEY is missing');
}

// ==================== SMTP FALLBACK ====================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_APP,
        pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD
    }
});

console.log('[emailService] SMTP fallback ready');

// ==================== CONFIG ====================
const emailProvider = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase();
const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_APP || 'tahuutu03@gmail.com';
const fromName = process.env.EMAIL_FROM_NAME || 'Admin BookingCare';

console.log(`[emailService] FROM: "${fromName}" <${fromEmail}>`);

// ====================== SEND VIA BREVO ======================
const sendViaBrevo = async (dataSend, type = '') => {
    if (!transactionalApi) {
        throw new Error('Brevo API not configured');
    }

    const html = getBodyHTMLEmailRemedy(dataSend, type);
    const toEmail = dataSend.receiveEmail || dataSend.email;

    try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();   // Khởi tạo trước

        sendSmtpEmail.sender = { 
            name: fromName, 
            email: fromEmail 
        };
        sendSmtpEmail.to = [{ 
            email: toEmail,
            name: dataSend.patientName || ""
        }];
        sendSmtpEmail.subject = dataSend.subject || 
            (type === 'Remedy' ? "Thông tin hóa đơn" : 
             type === 'Cancel' ? "Thông báo hủy lịch khám" : "Thông tin lịch khám");
        sendSmtpEmail.htmlContent = html;

        const result = await transactionalApi.sendTransacEmail(sendSmtpEmail);
        console.log(`[sendViaBrevo] ✅ SUCCESS - MessageId: ${result.messageId || 'N/A'}`);
        return result;

    } catch (err) {
        console.error('[sendViaBrevo] ❌ Brevo API Error:', {
            message: err.message,
            statusCode: err.statusCode,
            body: err.response?.body || err.body
        });
        throw err;   // Throw để fallback SMTP
    }
};

// ====================== SEND VIA SMTP ======================
const sendViaNodemailer = async (dataSend, type = '') => {
    const html = getBodyHTMLEmailRemedy(dataSend, type);

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: dataSend.receiveEmail || dataSend.email,
        subject: dataSend.subject || "Thông báo từ BookingCare",
        html: html,
    };

    return await transporter.sendMail(mailOptions);
};

// ====================== MAIN FUNCTION ======================
const sendSimpleEmail = async (dataSend) => {
    console.log(`[sendSimpleEmail] Mode: ${emailProvider} | Brevo: ${!!transactionalApi}`);

    if ((emailProvider === 'brevo' || emailProvider === 'auto') && transactionalApi) {
        try {
            const result = await sendViaBrevo(dataSend, dataSend.type || '');
            console.log('[sendSimpleEmail] ✅ Sent via Brevo');
            return result;
        } catch (err) {
            console.warn('[sendSimpleEmail] Brevo failed → fallback SMTP:', err.message);
        }
    }

    // Fallback SMTP
    const result = await sendViaNodemailer(dataSend, dataSend.type || '');
    console.log('[sendSimpleEmail] ✅ Sent via SMTP');
    return result;
};

// ====================== SEND ATTACHMENT (FIXED - Brevo) ======================
const sendAttachment = async (dataSend) => {
    const imgBase64 = dataSend?.imgBase64 || '';
    if (!imgBase64) {
        console.warn('[sendAttachment] No base64 provided');
        return await sendViaNodemailer(dataSend, 'Remedy');
    }

    const base64Part = imgBase64.split('base64,')[1] || imgBase64;
    const filename = `remedy-${dataSend.patientId || 'unknown'}-${Date.now()}.png`;
    const html = getBodyHTMLEmailRemedy(dataSend, 'Remedy');
    const toEmail = dataSend.email || dataSend.receiveEmail;

    console.log(`[sendAttachment] To: ${toEmail} | From: ${fromEmail} | Base64: ${base64Part.length} chars`);

    // ==================== BREVO ATTACHMENT ====================
    if ((emailProvider === 'brevo' || emailProvider === 'auto') && transactionalApi) {
        try {
            const sendSmtpEmail = new Brevo.SendSmtpEmail();   // ← Khởi tạo trước

            sendSmtpEmail.sender = { 
                name: fromName, 
                email: fromEmail 
            };
            sendSmtpEmail.to = [{ 
                email: toEmail,
                name: dataSend.patientName || "Bệnh nhân"
            }];
            sendSmtpEmail.subject = dataSend.subject || "Thông tin hóa đơn - Kết quả khám bệnh";
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.attachment = [{
                name: filename,
                content: base64Part,
                contentType: 'image/png'
            }];

            const result = await transactionalApi.sendTransacEmail(sendSmtpEmail);
            console.log('[sendAttachment] ✅ Brevo with attachment SUCCESS');
            return result;
        } catch (err) {
            console.error('[sendAttachment] ❌ Brevo failed:', err.response?.body || err.message);
        }
    }

    // ==================== SMTP FALLBACK ====================
    try {
        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: toEmail,
            subject: dataSend.subject || "Thông tin hóa đơn - Kết quả khám bệnh",
            html: html,
            attachments: [{
                filename: filename,
                content: base64Part,
                encoding: 'base64',
                contentType: 'image/png'
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[sendAttachment] ✅ SMTP with attachment SUCCESS');
        return info;
    } catch (smtpErr) {
        console.error('[sendAttachment] ❌ SMTP failed:', smtpErr.message);
        throw smtpErr;
    }
};

// ====================== HTML BODY (paste lại hàm cũ của bạn) ======================
const getBodyHTMLEmailRemedy = (dataSend, type) => {
    console.log('[getBodyHTMLEmailRemedy] building body, type:', type, 'language:', dataSend?.language);
    let result = '';
        if (type === '' || type === 'Booking') {
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
    } else if (type === 'Cancel') {
        // Cancellation email body
        const reasonText = dataSend.cancelReason ? (dataSend.language === 'vi' ? `Lý do: ${dataSend.cancelReason}` : `Reason: ${dataSend.cancelReason}`) : '';
        if (dataSend.language === 'vi') {
            result = `
                <h3>Xin chào ${dataSend.patientName}!</h3>
                <p>Rất tiếc, lịch khám của bạn đã bị hủy bởi bác sĩ.</p>
                <p>Thông tin lịch hủy:</p>
                <ul>
                    <li>Thời gian: ${dataSend.timeString}</li>
                    <li>Bác sĩ: ${dataSend.doctorName}</li>
                </ul>
                <p>${reasonText}</p>
                <p>Vui lòng liên hệ phòng khám để sắp xếp lại lịch khám nếu cần.</p>
                <p>Xin chân thành cảm ơn!</p>
            `;
        } else {
            result = `
                <h3>Dear ${dataSend.patientName}!</h3>
                <p>We are sorry to inform you that your appointment has been cancelled by the doctor.</p>
                <p>Cancellation details:</p>
                <ul>
                    <li>Time: ${dataSend.timeString}</li>
                    <li>Doctor: ${dataSend.doctorName}</li>
                </ul>
                <p>${reasonText}</p>
                <p>Please contact the clinic to reschedule if needed.</p>
                <p>Best regards!</p>
            `;
        }
    }
    return result;
};

module.exports = { sendSimpleEmail, sendAttachment, getBodyHTMLEmailRemedy };