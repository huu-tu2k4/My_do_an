
const { Resend } = require('resend');
require('dotenv').config();
const nodemailer = require('nodemailer');

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
if (!hasResendKey) console.warn('[emailService] Warning: RESEND_API_KEY is missing - Resend will be unavailable');

const resend = hasResendKey ? new Resend(process.env.RESEND_API_KEY) : null;

// Nodemailer / SMTP setup (optional)
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const hasSmtp = !!(smtpHost && smtpPort && smtpUser && smtpPass);
if (!hasSmtp) console.warn('[emailService] Warning: SMTP credentials missing - Nodemailer will be unavailable');

let transporter = null;
if (hasSmtp) {
    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass }
    });
    transporter.verify()
        .catch(err => console.warn('[emailService] SMTP transporter verify failed', err?.message || err));
}

// Provider selection: 'resend' | 'smtp' | 'auto'
const emailProvider = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase();
console.log('[emailService] EMAIL_PROVIDER:', emailProvider);

// Build a valid `from` field: "Name <email@example.com>"
const fromEmail = process.env.EMAIL_APP || process.env.FROM_EMAIL || '';
const fromName = process.env.EMAIL_FROM_NAME || 'Admin Booking Care';
const fromField = fromEmail && fromEmail.includes('@') ? `${fromName} <${fromEmail}>` : `${fromName} <no-reply@example.com>`;
console.log('[emailService] using FROM field masked:', maskKey(fromField));
if (!fromEmail) console.warn('[emailService] Warning: EMAIL_APP (from email) is missing; using no-reply placeholder');

const sendViaResend = async (dataSend, type = '') => {
    const html = getBodyHTMLEmailRemedy(dataSend, type);
    console.log('[sendViaResend] sending', { type, to: dataSend.receiveEmail || dataSend.email, subject: dataSend.subject, htmlLength: (html || '').length });
    const { data, error } = await resend.emails.send({
        from: fromField,
        to: dataSend.receiveEmail || dataSend.email,
        subject: dataSend.subject || (type === 'Remedy' ? "Thông tin hóa đơn" : "Thông tin lịch khám"),
        html: html,
    });
    if (error) {
        const e = new Error('Resend send failed');
        e.raw = error;
        throw e;
    }
    return data;
};

const sendViaNodemailer = async (dataSend, type = '') => {
    if (!transporter) throw new Error('SMTP transporter not configured');
    const html = getBodyHTMLEmailRemedy(dataSend, type);
    const mailOptions = {
        from: fromField,
        to: dataSend.receiveEmail || dataSend.email,
        subject: dataSend.subject || (type === 'Remedy' ? "Thông tin hóa đơn" : "Thông tin lịch khám"),
        html: html,
    };
    const info = await transporter.sendMail(mailOptions);
    return info;
};

const sendSimpleEmail = async (dataSend) => {
    const emailType = dataSend?.type || '';
    const preview = {
        to: dataSend?.receiveEmail || dataSend?.email,
        subject: dataSend?.subject || 'Thông tin lịch khám',
        type: emailType,
        language: dataSend?.language,
        time: dataSend?.time,
        doctorName: dataSend?.doctorName,
        hasRedirectLink: !!dataSend?.redirectLink,
        htmlLength: (getBodyHTMLEmailRemedy(dataSend, emailType) || '').length,
    };
    console.log('[sendSimpleEmail] sending email preview:', preview);
    // log generated body for debugging
    try {
        const debugHtml = getBodyHTMLEmailRemedy(dataSend, emailType) || '';
        console.log('[sendSimpleEmail] debug body snippet:', debugHtml.substring(0, 300));
    } catch (err) {
        console.warn('[sendSimpleEmail] error generating debug body', err?.message || err);
    }

    // Decide provider behavior based on EMAIL_PROVIDER
    if (emailProvider === 'resend') {
        if (!(hasResendKey && resend)) throw new Error('Resend provider selected but RESEND_API_KEY missing');
        const result = await sendViaResend(dataSend, emailType);
        console.log('[sendSimpleEmail] ✅ Resend sent, id:', result?.id || result);
        return result;
    }

    if (emailProvider === 'smtp') {
        if (!hasSmtp) throw new Error('SMTP provider selected but SMTP_* env vars missing');
        const result = await sendViaNodemailer(dataSend, emailType);
        console.log('[sendSimpleEmail] ✅ SMTP sent, info:', result);
        return result;
    }

    // auto mode: try Resend first (if configured), then fallback to SMTP
    if (emailProvider === 'auto') {
        if (hasResendKey && resend) {
            try {
                const result = await sendViaResend(dataSend, emailType);
                console.log('[sendSimpleEmail] ✅ Resend sent, id:', result?.id || result);
                return result;
            } catch (err) {
                console.warn('[sendSimpleEmail] Resend failed, will attempt SMTP fallback if available:', err?.message || err);
                // if authentication error (401) or other, fallback to SMTP when available
                const status = err?.raw?.statusCode || err?.statusCode || null;
                if (hasSmtp && (status === 401 || status === 403 || true)) {
                    return await sendViaNodemailer(dataSend, emailType);
                }
                throw err;
            }
        }

        if (hasSmtp) {
            const result = await sendViaNodemailer(dataSend, emailType);
            console.log('[sendSimpleEmail] ✅ SMTP sent, info:', result);
            return result;
        }

        const err = new Error('No email provider configured (RESEND_API_KEY or SMTP_* missing)');
        console.error('[sendSimpleEmail] ', err.message);
        throw err;
    }

    throw new Error(`Unknown EMAIL_PROVIDER value: ${emailProvider}`);
};

const sendAttachment = async (dataSend) => {
    const imgBase64 = dataSend?.imgBase64 || '';
    const base64Part = imgBase64.split('base64,')[1] || imgBase64;
    let attachmentSize = 0;
    try { attachmentSize = Math.ceil((base64Part.length * 3) / 4); } catch (e) { attachmentSize = 0; }

    console.log('[sendAttachment] preparing to send attachment to:', dataSend?.email || dataSend?.receiveEmail, 'patientId:', dataSend?.patientId, 'attachmentBytesApprox:', attachmentSize);

    const filename = `remedy-${dataSend.patientId}-${new Date().getTime()}.png`;

    // provider selection
    if (emailProvider === 'resend') {
        if (!(hasResendKey && resend)) throw new Error('Resend provider selected but RESEND_API_KEY missing');
        const result = await resend.emails.send({
            from: fromField,
            to: dataSend.email || dataSend.receiveEmail,
            subject: dataSend.subject || "Thông tin hóa đơn",
            html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
            attachments: [ { filename, content: base64Part, encoding: 'base64' } ]
        });
        console.log('[sendAttachment] ✅ Resend attachment sent, id:', result?.id || result);
        return result;
    }

    if (emailProvider === 'smtp') {
        if (!hasSmtp) throw new Error('SMTP provider selected but SMTP_* env vars missing');
        const mailOptions = {
            from: fromField,
            to: dataSend.email || dataSend.receiveEmail,
            subject: dataSend.subject || "Thông tin hóa đơn",
            html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
            attachments: [{ filename, content: base64Part, encoding: 'base64' }]
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('[sendAttachment] ✅ SMTP attachment sent, info:', info);
        return info;
    }

    // auto: try resend then smtp
    if (emailProvider === 'auto') {
        if (hasResendKey && resend) {
            try {
                const result = await resend.emails.send({
                    from: fromField,
                    to: dataSend.email || dataSend.receiveEmail,
                    subject: dataSend.subject || "Thông tin hóa đơn",
                    html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
                    attachments: [ { filename, content: base64Part, encoding: 'base64' } ]
                });
                console.log('[sendAttachment] ✅ Resend attachment sent, id:', result?.id || result);
                return result;
            } catch (err) {
                console.warn('[sendAttachment] Resend failed, will attempt SMTP fallback if available:', err?.message || err);
                if (hasSmtp) {
                    const mailOptions = {
                        from: fromField,
                        to: dataSend.email || dataSend.receiveEmail,
                        subject: dataSend.subject || "Thông tin hóa đơn",
                        html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
                        attachments: [{ filename, content: base64Part, encoding: 'base64' }]
                    };
                    const info = await transporter.sendMail(mailOptions);
                    console.log('[sendAttachment] ✅ SMTP attachment sent, info:', info);
                    return info;
                }
                throw err;
            }
        }

        if (hasSmtp) {
            const mailOptions = {
                from: fromField,
                to: dataSend.email || dataSend.receiveEmail,
                subject: dataSend.subject || "Thông tin hóa đơn",
                html: getBodyHTMLEmailRemedy(dataSend, 'Remedy'),
                attachments: [{ filename, content: base64Part, encoding: 'base64' }]
            };
            const info = await transporter.sendMail(mailOptions);
            console.log('[sendAttachment] ✅ SMTP attachment sent, info:', info);
            return info;
        }

        const err = new Error('No email provider configured (RESEND_API_KEY or SMTP_* missing)');
        console.error('[sendAttachment] ', err.message);
        throw err;
    }

    throw new Error(`Unknown EMAIL_PROVIDER value: ${emailProvider}`);
};

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

module.exports = {
    sendSimpleEmail,
    sendAttachment,
    getBodyHTMLEmailRemedy
};