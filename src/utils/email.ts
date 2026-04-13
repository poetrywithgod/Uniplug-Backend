import { createTransport } from 'nodemailer';
import { EMAIL_USERNAME, EMAIL_APP_PASSWORD } from '../configs/envConfig';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { mailLog } from '../configs/loggerConfig';

// Create email transporter using Gmail service
const createEmailTransporter = () => {
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

export const sendOtpEmail = async (
  name: string,
  email: string,
  otpCode: string,
) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `Uniplug Team <${EMAIL_USERNAME}>`,
    to: email,
    subject: 'Verify your Uniplug account - OTP Code',
    html: `
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
                    background-color: #f5f5f5;
                    color: #333;
                }
                .container {
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
                    color: #6666ff;
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
                    background-color: #6666ff;
                    color: white;
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
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: #666;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://dummyimage.com/320x100/0f172a/ffffff&text=UNIPLUG" 
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
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    mailLog.info(`OTP email sent to ${email}: ${info.response}`);
  } catch (error) {
    mailLog.error(`Error sending OTP email to ${email}: ${error}`);
  }
};

export const resendOtpEmail = async (
  name: string,
  email: string,
  otpCode: string,
) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `Uniplug Team <${EMAIL_USERNAME}>`,
    to: email,
    subject: 'Resend OTP Verification Code',
    html: `
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
                    background-color: #f5f5f5;
                    color: #333;
                }
                .container {
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
                    color: #6666ff;
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
                    background-color: #6666ff;
                    color: white;
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
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: #666;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .resend-notice {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: #856404;
                    margin: 20px 0;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://dummyimage.com/320x100/0f172a/ffffff&text=UNIPLUG" 
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
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    mailLog.info(`Resend OTP email sent to ${email}: ${info.response}`);
  } catch (error) {
    mailLog.error(`Error sending resend OTP email to ${email}: ${error}`);
  }
};

export const sendPasswordResetEmail = async (
  name: string,
  email: string,
  otpCode: string,
) => {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `Uniplug Team <${EMAIL_USERNAME}>`,
    to: email,
    subject: 'Reset Your Uniplug Password - OTP Code',
    html: `
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
                    background-color: #f5f5f5;
                    color: #333;
                }
                .container {
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
                    color: #6666ff;
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
                    background-color: #6666ff;
                    color: white;
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
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: #666;
                    margin: 20px 0;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    color: #856404;
                    margin: 20px 0;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://dummyimage.com/320x100/0f172a/ffffff&text=UNIPLUG" 
                        alt="Uniplug Logo" class="logo">
                </div>
                
                <div class="greeting">Hello ${name}!</div>
                
                <div class="message">
                    We received a request to reset your Uniplug account password. Use the code below to proceed:
                </div>
                
                <div class="otp-box">
                    <div class="otp-code">${otpCode}</div>
                </div>
                
                <div class="note">
                    This code expires in 10 minutes. Don't share it with anyone.
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
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    mailLog.info(`Password reset OTP email sent to ${email}: ${info.response}`);
  } catch (error) {
    mailLog.error(`Error sending password reset email to ${email}: ${error}`);
  }
};
