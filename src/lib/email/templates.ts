interface VerifyEmailProps {
  displayName: string;
  verifyUrl: string;
}

export function verificationEmail({ displayName, verifyUrl }: VerifyEmailProps) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
      <h1 style="color: #4A1B3C; text-align: center;">Welcome to Luna, ${displayName}!</h1>
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">Thank you for joining Luna. We're thrilled to have you here.</p>
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">Please verify your email address by clicking the button below. This link will expire in 24 hours.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #E85D9A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #777777; font-size: 14px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;
}

interface PasswordResetProps {
  displayName: string;
  resetUrl: string;
}

export function passwordResetEmail({ displayName, resetUrl }: PasswordResetProps) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
      <h1 style="color: #4A1B3C; text-align: center;">Luna Password Reset</h1>
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">Hi ${displayName},</p>
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #E85D9A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #777777; font-size: 14px; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;
}
