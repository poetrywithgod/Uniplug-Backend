import { createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BrevoClient } from '@getbrevo/brevo';
import {
  EMAIL_USERNAME,
  EMAIL_APP_PASSWORD,
  EMAIL_PROVIDER,
  BREVO_API_KEY,
  FRONTEND_URL,
} from '../configs/envConfig';
import { mailLog } from '../configs/loggerConfig';
import { escapeHtml } from './sanitize';

const BRAND_LOGO_URL =
  'https://res.cloudinary.com/dpesanzkk/image/upload/q_auto/f_auto/v1776107303/WhatsApp_Image_2026-04-13_at_19.55.27_bh1h5c.jpg';
const BRAND_PRIMARY = '#0c241f';
const BRAND_WHITE = '#ffffff';

// Create email transporter using Gmail service (retained without degradation)
export const createGmailTransporter = () => {
  return createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USERNAME, // Gmail username
      pass: EMAIL_APP_PASSWORD, // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false,
    },
    // logger: true,
    debug: true,
  } as SMTPTransport.Options);
};

// Retained alias for backward compatibility
export const createEmailTransporter = createGmailTransporter;

// Lazy-initialized Brevo API Client
let brevoClientInstance: BrevoClient | null = null;
export const getBrevoClient = (): BrevoClient | null => {
  if (!brevoClientInstance && BREVO_API_KEY) {
    brevoClientInstance = new BrevoClient({
      apiKey: BREVO_API_KEY,
      timeoutInSeconds: 30,
      maxRetries: 3,
    });
  }
  return brevoClientInstance;
};

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: { email: string; name?: string };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  logLabel: string;
}

/**
 * Unified email dispatcher that defaults to Brevo and retains Gmail as an active fallback / alternative.
 */
export const dispatchEmail = async (options: SendEmailOptions): Promise<void> => {
  const provider = (EMAIL_PROVIDER || 'brevo').toLowerCase();
  const fromName = options.fromName || 'Uniplug Team';
  const fromEmail = options.fromEmail || EMAIL_USERNAME || 'uniplug.edu@gmail.com';

  // 1. Primary path: Brevo (when provider is brevo and API key is present)
  if (provider === 'brevo' && BREVO_API_KEY) {
    try {
      const client = getBrevoClient();
      if (!client) {
        throw new Error('Brevo client could not be initialized');
      }

      const brevoAttachments = options.attachments?.map((att) => ({
        name: att.filename,
        content: att.content.toString('base64'),
      }));

      const result = await client.transactionalEmails.sendTransacEmail({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
        htmlContent: options.html,
        attachment: brevoAttachments,
        replyTo: options.replyTo,
      });

      mailLog.info(
        `[Brevo] ${options.logLabel} sent to ${options.to}: Message ID ${result.messageId}`,
      );
      return;
    } catch (brevoError) {
      mailLog.error(
        `[Brevo] Error sending ${options.logLabel} to ${options.to}: ${brevoError}. Retaining reliability by failing over to Gmail...`,
      );
    }
  }

  // 2. Secondary path / Failover: Gmail (retained without degradation)
  try {
    const transporter = createGmailTransporter();
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
      ...(options.replyTo ? { replyTo: options.replyTo.email } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    mailLog.info(`[Gmail] ${options.logLabel} sent to ${options.to}: ${info.response}`);
  } catch (gmailError) {
    mailLog.error(`[Gmail] Error sending ${options.logLabel} to ${options.to}: ${gmailError}`);
  }
};

export const sendOtpEmail = async (
  name: string,
  email: string,
  otpCode: string,
) => {
  const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: ${BRAND_WHITE};
                    color: ${BRAND_PRIMARY};
                }
                .container {
                    margin: 0 auto;
                    background-color: ${BRAND_WHITE};
                    border-radius: 8px;
                    padding: 30px;
                    border: 1px solid ${BRAND_PRIMARY};
                }
                .logo {
                    width: 200px;
                    margin: 0 auto 20px auto;
                    display: block;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: ${BRAND_PRIMARY};
                    margin: 0;
                    font-size: 24px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 25px;
                    text-align: center;
                }
                .otp-box {
                    background-color: ${BRAND_PRIMARY};
                    color: ${BRAND_WHITE};
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 25px 0;
                }
                .otp-code {
                    font-size: 28px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    margin: 0;
                }
                .note {
                    background-color: ${BRAND_WHITE};
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: ${BRAND_PRIMARY};
                    border: 1px solid ${BRAND_PRIMARY};
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid ${BRAND_PRIMARY};
                    color: ${BRAND_PRIMARY};
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${BRAND_LOGO_URL}" 
                        alt="Uniplug Logo" class="logo">
                </div>
                
                <div class="greeting">Hello ${name}!</div>
                
                <div class="message">
                    Welcome to Uniplug! Please use the code below to verify your account:
                </div>
                
                <div class="otp-box">
                    <div class="otp-code">${otpCode}</div>
                </div>
                
                <div class="note">
                    This code expires in 10 minutes. Don't share it with anyone.
                </div>
                
                <div class="footer">
                    Best regards,<br>
                    The Uniplug Team
                </div>
            </div>
        </body>
        </html>
        `;

  await dispatchEmail({
    to: email,
    toName: name,
    subject: 'Verify your Uniplug account - OTP Code',
    html,
    fromName: 'Uniplug Team',
    logLabel: 'OTP email',
  });
};

export const resendOtpEmail = async (
  name: string,
  email: string,
  otpCode: string,
) => {
  const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Verification Code</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: ${BRAND_WHITE};
                    color: ${BRAND_PRIMARY};
                }
                .container {
                    margin: 0 auto;
                    background-color: ${BRAND_WHITE};
                    border-radius: 8px;
                    padding: 30px;
                    border: 1px solid ${BRAND_PRIMARY};
                }
                .logo {
                    width: 200px;
                    margin: 0 auto 20px auto;
                    display: block;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: ${BRAND_PRIMARY};
                    margin: 0;
                    font-size: 24px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 25px;
                    text-align: center;
                }
                .otp-box {
                    background-color: ${BRAND_PRIMARY};
                    color: ${BRAND_WHITE};
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 25px 0;
                }
                .otp-code {
                    font-size: 28px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    margin: 0;
                }
                .note {
                    background-color: ${BRAND_WHITE};
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: ${BRAND_PRIMARY};
                    border: 1px solid ${BRAND_PRIMARY};
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid ${BRAND_PRIMARY};
                    color: ${BRAND_PRIMARY};
                    font-size: 14px;
                }
                .resend-notice {
                    background-color: ${BRAND_WHITE};
                    border: 1px solid ${BRAND_PRIMARY};
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: ${BRAND_PRIMARY};
                    margin: 20px 0;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${BRAND_LOGO_URL}" 
                        alt="Uniplug Logo" class="logo">
                </div>
                
                <div class="greeting">Hello ${name}!</div>
                
                <div class="message">
                   🔄 This is a new verification code as requested
                </div>
                
                <div class="otp-box">
                    <div class="otp-code">${otpCode}</div>
                </div>
                
                <div class="note">
                    This new code expires in 10 minutes and replaces any previous codes. Don't share it with anyone.
                </div>
                
                <div class="footer">
                    Having trouble? Contact our support team.<br>
                    Best regards,<br>
                    The Uniplug Team
                </div>
            </div>
        </body>
        </html>
        `;

  await dispatchEmail({
    to: email,
    toName: name,
    subject: 'Resend OTP Verification Code',
    html,
    fromName: 'Uniplug Team',
    logLabel: 'Resend OTP email',
  });
};

export const sendPasswordResetEmail = async (
  name: string,
  email: string,
  resetLink: string,
) => {
  const safeResetLink = escapeHtml(resetLink);

  const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: ${BRAND_WHITE};
                    color: ${BRAND_PRIMARY};
                }
                .container {
                    margin: 0 auto;
                    background-color: ${BRAND_WHITE};
                    border-radius: 8px;
                    padding: 30px;
                    border: 1px solid ${BRAND_PRIMARY};
                }
                .logo {
                    width: 200px;
                    margin: 0 auto 20px auto;
                    display: block;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: ${BRAND_PRIMARY};
                    margin: 0;
                    font-size: 24px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 25px;
                    text-align: center;
                }
                .otp-box {
                    background-color: ${BRAND_PRIMARY};
                    color: ${BRAND_WHITE};
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 25px 0;
                }
                .otp-code {
                    font-size: 28px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    margin: 0;
                }
                .note {
                    background-color: ${BRAND_WHITE};
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: ${BRAND_PRIMARY};
                    border: 1px solid ${BRAND_PRIMARY};
                    margin: 20px 0;
                }
                .warning {
                    background-color: ${BRAND_WHITE};
                    border: 1px solid ${BRAND_PRIMARY};
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: ${BRAND_PRIMARY};
                    margin: 20px 0;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid ${BRAND_PRIMARY};
                    color: ${BRAND_PRIMARY};
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${BRAND_LOGO_URL}" 
                        alt="Uniplug Logo" class="logo">
                </div>
                
                <div class="greeting">Hello ${name}!</div>
                
                <div class="message">
                    We received a request to reset your account password. Click the button below to reset it:
                </div>
                
                <div style="text-align:center; margin: 25px 0;">
                    <a href="${safeResetLink}" style="background-color:${BRAND_PRIMARY}; color:${BRAND_WHITE}; padding:12px 24px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:bold;">
                        Reset Password
                    </a>
                </div>
                
                <div class="note">
                    This link expires soon. If the button doesn't work, copy and paste this link into your browser:
                    <div style="word-break: break-all; margin-top: 8px;">${safeResetLink}</div>
                </div>
                
                <div class="warning">
                    ⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <div class="footer">
                    Need help? Contact our support team.<br>
                    Best regards,<br>
                    The Uniplug Team
                </div>
            </div>
        </body>
        </html>
        `;

  await dispatchEmail({
    to: email,
    toName: name,
    subject: 'Reset Your Uniplug Password',
    html,
    fromName: 'Uniplug Team',
    logLabel: 'Password reset link email',
  });
};

export const sendStaffOnboardingEmail = async (payload: {
  name: string;
  email: string;
  password: string;
  role: string;
  adminId: string;
  schoolId: string;
  school: string;
  staffId: string;
  department: string;
  otpCode: string;
}) => {
  const safeName = escapeHtml(payload.name);
  const safeStaffId = escapeHtml(payload.staffId);
  const safeAdminId = escapeHtml(payload.adminId);
  const safeDepartment = escapeHtml(payload.department);
  const safePassword = escapeHtml(payload.password);
  const safeSchoolId = escapeHtml(payload.schoolId);
  const safeSchool = escapeHtml(payload.school);
  const roleLabel = payload.role === 'LECTURER' ? 'Lecturer' : 'Hostel Manager';

  const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${roleLabel} Account Created</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: ${BRAND_WHITE}; color: ${BRAND_PRIMARY}; }
                    .container { max-width: 620px; margin: 0 auto; background: ${BRAND_WHITE}; border-radius: 10px; padding: 28px; border: 1px solid ${BRAND_PRIMARY}; }
                    .logo { width: 220px; margin: 0 auto 18px; display: block; }
                    .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; text-align: center; }
                    .subtitle { text-align: center; color: ${BRAND_PRIMARY}; margin-bottom: 22px; }
                    .box { background: ${BRAND_WHITE}; border: 1px solid ${BRAND_PRIMARY}; border-radius: 8px; padding: 16px; margin: 14px 0; }
                    .row { margin: 8px 0; font-size: 14px; }
                    .label { color: ${BRAND_PRIMARY}; font-weight: 600; display: inline-block; width: 120px; }
                    .otp { background: ${BRAND_PRIMARY}; color: ${BRAND_WHITE}; text-align: center; font-size: 28px; letter-spacing: 4px; border-radius: 8px; padding: 12px; margin: 18px 0; }
                    .note { background: ${BRAND_WHITE}; border: 1px solid ${BRAND_PRIMARY}; color: ${BRAND_PRIMARY}; border-radius: 8px; padding: 12px; font-size: 13px; }
                    .footer { text-align: center; margin-top: 22px; color: ${BRAND_PRIMARY}; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="${BRAND_LOGO_URL}" alt="Uniplug Logo" class="logo" />
                    <div class="title">Welcome to Uniplug</div>
                    <div class="subtitle">Your ${roleLabel} account has been created by an administrator.</div>

                    <div class="box">
                        <div class="row"><span class="label">Full Name:</span> ${safeName}</div>
                        <div class="row"><span class="label">Role:</span> ${roleLabel}</div>
                        <div class="row"><span class="label">School ID:</span> ${safeSchoolId}</div>
                        <div class="row"><span class="label">School:</span> ${safeSchool}</div>
                        <div class="row"><span class="label">Staff ID:</span> ${safeStaffId}</div>
                        <div class="row"><span class="label">Admin ID:</span> ${safeAdminId}</div>
                        <div class="row"><span class="label">Department:</span> ${safeDepartment}</div>
                        <div class="row"><span class="label">Email:</span> ${escapeHtml(payload.email)}</div>
                        <div class="row"><span class="label">Password:</span> ${safePassword}</div>
                    </div>

                    <div style="font-size: 14px; margin-top: 14px;">Verify your account with this OTP before first login:</div>
                    <div class="otp">${payload.otpCode}</div>

                    <div class="note">
                        This OTP expires in 10 minutes. For security, change your password after first login.
                    </div>

                    <div class="footer">
                        Best regards,<br />
                        The Uniplug Team
                    </div>
                </div>
            </body>
            </html>
        `;

  await dispatchEmail({
    to: payload.email,
    toName: payload.name,
    subject: `${roleLabel} Account Created - Uniplug Login Details`,
    html,
    fromName: 'Uniplug Team',
    logLabel: 'Staff onboarding email',
  });
};

export const sendSchoolAdminOnboardingEmail = async (payload: {
  name: string;
  email: string;
  password: string;
  adminId: string;
  schoolId: string;
  school: string;
  otpCode: string;
}) => {
  const safeName = escapeHtml(payload.name);
  const safeSchoolId = escapeHtml(payload.schoolId);
  const safeSchool = escapeHtml(payload.school);
  const safePassword = escapeHtml(payload.password);
  const safeAdminId = escapeHtml(payload.adminId);

  const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>School Admin Account Created</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: ${BRAND_WHITE}; color: ${BRAND_PRIMARY}; }
                    .container { max-width: 620px; margin: 0 auto; background: ${BRAND_WHITE}; border-radius: 10px; padding: 28px; border: 1px solid ${BRAND_PRIMARY}; }
                    .logo { width: 220px; margin: 0 auto 18px; display: block; }
                    .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; text-align: center; }
                    .subtitle { text-align: center; color: ${BRAND_PRIMARY}; margin-bottom: 22px; }
                    .box { background: ${BRAND_WHITE}; border: 1px solid ${BRAND_PRIMARY}; border-radius: 8px; padding: 16px; margin: 14px 0; }
                    .row { margin: 8px 0; font-size: 14px; }
                    .label { color: ${BRAND_PRIMARY}; font-weight: 600; display: inline-block; width: 120px; }
                    .otp { background: ${BRAND_PRIMARY}; color: ${BRAND_WHITE}; text-align: center; font-size: 28px; letter-spacing: 4px; border-radius: 8px; padding: 12px; margin: 18px 0; }
                    .note { background: ${BRAND_WHITE}; border: 1px solid ${BRAND_PRIMARY}; color: ${BRAND_PRIMARY}; border-radius: 8px; padding: 12px; font-size: 13px; }
                    .footer { text-align: center; margin-top: 22px; color: ${BRAND_PRIMARY}; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="${BRAND_LOGO_URL}" alt="Uniplug Logo" class="logo" />
                    <div class="title">Welcome to Uniplug</div>
                    <div class="subtitle">Your School Admin account has been created by the platform super admin.</div>

                    <div class="box">
                        <div class="row"><span class="label">Full Name:</span> ${safeName}</div>
                        <div class="row"><span class="label">Role:</span> School Admin</div>
                        <div class="row"><span class="label">School ID:</span> ${safeSchoolId}</div>
                        <div class="row"><span class="label">School:</span> ${safeSchool}</div>
                        <div class="row"><span class="label">Admin ID:</span> ${safeAdminId}</div>
                        <div class="row"><span class="label">Email:</span> ${escapeHtml(payload.email)}</div>
                        <div class="row"><span class="label">Password:</span> ${safePassword}</div>
                    </div>

                    <div style="font-size: 14px; margin-top: 14px;">Verify your account with this OTP before first login:</div>
                    <div class="otp">${payload.otpCode}</div>

                    <div class="note">
                        This OTP expires in 10 minutes. Your account must also be verified by the super admin before operations are allowed.
                    </div>

                    <div class="footer">
                        Best regards,<br />
                        The Uniplug Team
                    </div>
                </div>
            </body>
            </html>
        `;

  await dispatchEmail({
    to: payload.email,
    toName: payload.name,
    subject: 'School Admin Account Created - Uniplug Login Details',
    html,
    fromName: 'Uniplug Team',
    logLabel: 'School admin onboarding email',
  });
};

export const sendOfferIssuedEmail = async (payload: {
  email: string;
  applicantName: string;
  schoolName: string;
  offeredCourse: string;
  offeredFaculty: string;
  isAlternativeOffer: boolean;
  deadlineDays: number;
}) => {
  const html = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 20px; }
        .card { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { color: #1E3A8A; font-size: 22px; font-weight: bold; margin-bottom: 10px; }
        .badge { display: inline-block; padding: 4px 10px; background: #DBEAFE; color: #1E40AF; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .alt-badge { background: #FEF3C7; color: #92400E; }
        .btn { display: inline-block; background: #1E3A8A; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style></head>
      <body>
        <div class="card">
          <div class="header">${escapeHtml(payload.schoolName)} — Admission Offer</div>
          <p>Dear ${escapeHtml(payload.applicantName)},</p>
          <p>Congratulations! You have been granted a provisional offer of admission.</p>
          <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #1E3A8A; margin: 15px 0;">
            <p><strong>Offered Course:</strong> ${escapeHtml(payload.offeredCourse)}</p>
            <p><strong>Faculty:</strong> ${escapeHtml(payload.offeredFaculty)}</p>
            <p><strong>Offer Type:</strong> <span class="badge ${payload.isAlternativeOffer ? 'alt-badge' : ''}">${payload.isAlternativeOffer ? 'Realigned Alternative Offer' : 'Original Choice'}</span></p>
          </div>
          <p>Please log in to your applicant portal within <strong>${payload.deadlineDays} days</strong> to review and respond to this offer.</p>
          <a href="${FRONTEND_URL}/login" class="btn">View Offer Letter</a>
        </div>
      </body>
      </html>
    `;

  await dispatchEmail({
    to: payload.email,
    toName: payload.applicantName,
    subject: `Admission Offer Issued — ${payload.schoolName}`,
    html,
    fromName: 'Uniplug Admissions',
    logLabel: 'Offer issued email',
  });
};

export const sendOfferAcceptedEmailWithAttachment = async (payload: {
  email: string;
  applicantName: string;
  schoolName: string;
  offeredCourse: string;
  matricNumber: string;
  pdfBuffer: Buffer;
}) => {
  const html = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 20px; }
        .card { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { color: #15803D; font-size: 22px; font-weight: bold; margin-bottom: 10px; }
        .matric-box { background: #DCFCE7; color: #166534; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; }
      </style></head>
      <body>
        <div class="card">
          <div class="header">🎉 Welcome to ${escapeHtml(payload.schoolName)}!</div>
          <p>Dear ${escapeHtml(payload.applicantName)},</p>
          <p>Thank you for accepting your admission offer into <strong>${escapeHtml(payload.offeredCourse)}</strong>.</p>
          <div class="matric-box">
            YOUR MATRICULATION NUMBER: ${escapeHtml(payload.matricNumber)}
          </div>
          <p>Your official <strong>Provisional Admission Offer Letter (PDF)</strong> is attached to this email and is also available in your student portal.</p>
          <p>Please print and bring your offer letter for physical screening and clearance.</p>
        </div>
      </body>
      </html>
    `;

  await dispatchEmail({
    to: payload.email,
    toName: payload.applicantName,
    subject: `Admission Offer Accepted & Official Offer Letter — ${payload.schoolName}`,
    html,
    fromName: 'Uniplug Admissions',
    attachments: [
      {
        filename: `Admission_Offer_Letter_${payload.matricNumber.replace(/\//g, '_')}.pdf`,
        content: payload.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
    logLabel: 'Offer accepted email',
  });
};

