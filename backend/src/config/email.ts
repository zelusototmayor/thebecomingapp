import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  // If Resend is not configured, log the reset link (for development)
  if (!resend) {
    console.log('========================================');
    console.log('PASSWORD RESET EMAIL (Resend not configured)');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('========================================');
    return true;
  }

  try {
    await resend.emails.send({
      from: 'The Becoming App <noreply@yourdomain.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0c1426;">Reset Your Password</h2>
          <p>You requested to reset your password for The Becoming App.</p>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background: linear-gradient(135deg, #14b8a6, #10b981);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            Or copy this link: ${resetUrl}
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};
