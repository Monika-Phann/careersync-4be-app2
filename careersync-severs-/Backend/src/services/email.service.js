// services/email.service.js - SendGrid Implementation
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;

if (!SENDGRID_API_KEY) {
  console.error('⚠️ WARNING: SENDGRID_API_KEY is not set in environment variables');
}

if (!EMAIL_FROM) {
  console.error('⚠️ WARNING: EMAIL_FROM or SENDGRID_FROM_EMAIL is not set in environment variables');
}

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured');
} else {
  console.error('❌ SendGrid API key not configured - emails will fail');
}

// Helper function to send email via SendGrid
const sendMail = async (to, subject, html, text) => {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key is not configured. Please set SENDGRID_API_KEY in environment variables.');
  }

  if (!EMAIL_FROM) {
    throw new Error('Email FROM address is not configured. Please set EMAIL_FROM or SENDGRID_FROM_EMAIL in environment variables.');
  }

  try {
    const msg = {
      to: to.trim(),
      from: EMAIL_FROM,
      subject,
      text: text || '',
      html: html || '',
    };

    console.log(`📧 Sending email to: ${to}, from: ${EMAIL_FROM}, subject: ${subject}`);
    const result = await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to}`, result[0]?.statusCode ? `Status: ${result[0].statusCode}` : '');
    return result;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    if (error.response) {
      console.error('SendGrid Error Response:', JSON.stringify(error.response.body, null, 2));
    }
    if (error.code) {
      console.error('SendGrid Error Code:', error.code);
    }
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, token, role = 'acc_user') => {
  let baseUrl;
  let loginPath = '/signin'; 

  // 1. Determine the correct URL based on Role (Using PRODUCTION domains)
  if (role === 'admin') {
    // Admin App
    baseUrl = process.env.CLIENT_BASE_URL_ADMIN || 'https://admin-4be.ptascloud.online';
  } else if (role === 'mentor') {
    // Mentor App
    baseUrl = process.env.CLIENT_BASE_URL_MENTOR || 'https://mentor-4be.ptascloud.online';
    loginPath = '/login'; // Mentors use /login
  } else {
    // Student / User App
    // Fallback to your main domain if env var is missing
    baseUrl = process.env.CLIENT_BASE_URL_STUDENT || 'https://careersync-4be.ptascloud.online'; 
    loginPath = '/signin'; // Students use /signin
  }

  // The link specifically for logging in directly
  const loginUrl = `${baseUrl}${loginPath}`;
  
  // The verification link - Points to Frontend which usually calls API
  // NOTE: If you want this to hit the API directly (like we fixed earlier), 
  // ensure baseUrl matches the API or the Frontend handles the redirect.
  // Based on your fix, this should point to the API ideally, OR the frontend route we added.
  const verifyUrl = `${baseUrl}/verify-email?token=${token}&role=${role}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Welcome to CareerSync!</h2>
      
      <p>Your account has been created successfully.</p>
      
      <p><strong>Step 1:</strong> Please verify your email address:</p>
      <div style="margin: 20px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(90deg,#4F46E5,#7C3AED); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>

      <p><strong>Step 2:</strong> Log in to your dashboard:</p>
      <div style="margin: 20px 0;">
        <a href="${loginUrl}" style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Login Now
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="font-size: 12px; color: #666;">
        If you cannot click the buttons, copy these links:<br>
        Verify: <a href="${verifyUrl}">${verifyUrl}</a><br>
        Login: <a href="${loginUrl}">${loginUrl}</a>
      </p>
    </div>
  `;
  
  await sendMail(email, 'Verify your CareerSync account', html, `Verify: ${verifyUrl}\nLogin: ${loginUrl}`);
};

// Send password reset email
const sendResetPasswordEmail = async (email, token) => {
  // Default to Student App in Production
  const base = process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL || 'https://careersync-4be.ptascloud.online';
  const resetLink = `${base}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">Password Reset Request</h2>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background: linear-gradient(90deg,#4F46E5,#7C3AED); 
                  color: white; 
                  padding: 12px 30px; 
                  text-decoration: none; 
                  border-radius: 5px;
                  display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666;">Or copy this link: <br/> <a href="${resetLink}">${resetLink}</a></p>
      <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;
  
  await sendMail(email, 'Reset your CareerSync Password', html, `Reset password: ${resetLink}`);
};

// Send mentor approval email
const sendMentorApprovalEmail = async (toEmail, firstName) => {
  // Use student login page URL
  const loginUrl = process.env.CLIENT_BASE_URL 
    ? `${process.env.CLIENT_BASE_URL}/signin` 
    : 'https://careersync-4be.ptascloud.online/signin';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #4F46E5; margin: 0;">🎉 Congratulations!</h2>
      </div>
      
      <p style="font-size: 16px; color: #333;">Dear ${firstName},</p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        We are pleased to inform you that your application to become a Mentor at <strong>CareerSync</strong> has been <strong style="color: #10B981;">APPROVED</strong>!
      </p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Your account has been activated and you can now log in to your mentor dashboard to start guiding students and sharing your expertise.
      </p>
      
      <div style="background-color: #F0F9FF; border-left: 4px solid #4F46E5; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1E40AF; font-size: 16px;">What's Next?</p>
        <ul style="margin: 8px 0 0 0; color: #1E3A8A; padding-left: 20px; line-height: 1.8;">
          <li>Log in to your mentor account</li>
          <li>Complete your profile setup</li>
          <li>Create mentorship sessions</li>
          <li>Set your availability schedule</li>
          <li>Start connecting with mentees</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
          Login to Your Mentor Account
        </a>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:<br> 
        <a href="${loginUrl}" style="color: #4F46E5; word-break: break-all;">${loginUrl}</a>
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Best Regards,<br>
          <strong>The CareerSync Team</strong>
        </p>
      </div>
    </div>
  `;

  const text = `Congratulations ${firstName}!\n\nYour mentor application has been APPROVED!\n\nYour account has been activated. You can now log in to your mentor dashboard.\n\nLogin URL: ${loginUrl}\n\nBest Regards,\nThe CareerSync Team`;

  await sendMail(toEmail, '🎉 Congratulations! Your Mentor Application is Approved - CareerSync', html, text);
};

// Send mentor rejection email
const sendMentorRejectionEmail = async (toEmail, firstName, rejectionReason = null) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #EF4444; margin: 0;">Application Status Update</h2>
      </div>
      
      <p style="font-size: 16px; color: #333;">Dear ${firstName},</p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Thank you for your interest in becoming a mentor at <strong>CareerSync</strong>.
      </p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        After carefully reviewing your application, we regret to inform you that we are unable to approve your mentor profile at this time.
      </p>
      
      ${rejectionReason ? `
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #991B1B; font-size: 16px;">Rejection Reason:</p>
          <p style="margin: 8px 0 0 0; color: #7F1D1D; line-height: 1.6;">${rejectionReason}</p>
        </div>
      ` : ''}
      
      <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #92400E; line-height: 1.6;">
          If you have any questions about this decision or believe this may be a mistake, please don't hesitate to contact our support team. We're here to help.
        </p>
      </div>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        We appreciate your interest in CareerSync and encourage you to apply again in the future if your circumstances change.
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Best Regards,<br>
          <strong>The CareerSync Team</strong>
        </p>
      </div>
    </div>
  `;

  const text = `Application Status Update - Dear ${firstName}, Thank you for your interest. We regret to inform you that we are unable to approve your mentor profile at this time. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;

  await sendMail(toEmail, 'Update on Your Mentor Application - CareerSync', html, text);
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendMentorApprovalEmail,
  sendMentorRejectionEmail,
};
