import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter (using nodemailer for development, will use AWS SES in production)
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP service)
  // For production, configure AWS SES
  if (process.env.NODE_ENV === 'production') {
    // AWS SES configuration
    return nodemailer.createTransport({
      host: `email.${process.env.AWS_REGION}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_ACCESS_KEY_ID,
        pass: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  } else {
    // Development: Use Gmail or Ethereal for testing
    // For now, we'll log emails to console in development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  token: string,
  username: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@itemtracker.com',
    to: email,
    subject: 'Verify Your Email - Item Tracker',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to Item Tracker, ${username}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // In development, just log the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Verification Email (Development Mode):');
    console.log(`   To: ${email}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    console.log('   (Email sending disabled in development)');
    return;
  }

  // In production, send the actual email
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  username: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@itemtracker.com',
    to: email,
    subject: 'Reset Your Password - Item Tracker',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #EF4444;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <div class="footer">
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // In development, just log the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Password Reset Email (Development Mode):');
    console.log(`   To: ${email}`);
    console.log(`   Reset URL: ${resetUrl}`);
    console.log('   (Email sending disabled in development)');
    return;
  }

  // In production, send the actual email
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
