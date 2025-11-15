import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // If SendGrid API key is provided, use it
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Otherwise, use SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback: Gmail (requires app-specific password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // If no email config, return null (will log instead)
  return null;
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();

  if (!transporter) {
    // No email service configured - log the reset link
    console.log('📧 Password Reset Email (Email service not configured):');
    console.log(`To: ${email}`);
    console.log(`Subject: Reset Your Talendro Password`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('---');
    console.log('⚠️  To enable email sending, configure one of:');
    console.log('   - SENDGRID_API_KEY');
    console.log('   - SMTP_HOST, SMTP_USER, SMTP_PASS');
    console.log('   - GMAIL_USER, GMAIL_APP_PASSWORD');
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@talendro.com',
    to: email,
    subject: 'Reset Your Talendro Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0066cc 0%, #00a8cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Talendro™</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Precision Matches. Faster Results.</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #0066cc; margin-top: 0;">Password Reset Request</h2>
            
            <p>We received a request to reset your password for your Talendro account.</p>
            
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.<br>
              If you need assistance, visit our <a href="https://talendro-app-1.onrender.com/contact" style="color: #0066cc;">Contact page</a>.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Talendro™ - Password Reset Request
      
      We received a request to reset your password for your Talendro account.
      
      Click the link below to reset your password. This link will expire in 1 hour.
      
      ${resetUrl}
      
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      
      This is an automated message. Please do not reply to this email.
      If you need assistance, visit our Contact page: https://talendro-app-1.onrender.com/contact
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    // Fallback: log the reset link
    console.log('📧 Password Reset Email (Fallback - Email sending failed):');
    console.log(`To: ${email}`);
    console.log(`Subject: Reset Your Talendro Password`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('---');
    return { success: false, error: error.message };
  }
};

