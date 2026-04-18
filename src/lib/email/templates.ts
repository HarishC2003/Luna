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

export function periodReminderEmail({ displayName, daysUntil, predictedDate, appUrl }: { displayName: string, daysUntil: number, predictedDate: string, appUrl: string }) {
  return {
    subject: "Your period is coming up soon",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #4A1B3C; text-align: center;">Hi ${displayName},</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Your next period is predicted to begin in ${daysUntil > 0 ? daysUntil + ' days' : 'soon'}, around <strong>${predictedDate}</strong>.</p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Take this time to gently prepare: stay hydrated, pack some supplies, and remember to be kind to yourself as your body transitions.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/dashboard" style="background-color: #E85D9A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Luna</a>
        </div>
        <p style="color: #777777; font-size: 12px; text-align: center;">You can turn off these reminders anytime: <a href="${appUrl}/profile">Unsubscribe</a></p>
      </div>
    `,
    text: `Your period is coming up around ${predictedDate}. Stay hydrated and take care of yourself!`
  };
}

export function fertileWindowEmail({ displayName, fertileStart, fertileEnd, ovulationDate, appUrl }: { displayName: string, fertileStart: string, fertileEnd: string, ovulationDate: string, appUrl: string }) {
  return {
    subject: "Your fertile window is starting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #4A1B3C; text-align: center;">Hi ${displayName},</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Your body is entering its fertile window. This window is predicted between <strong>${fertileStart}</strong> and <strong>${fertileEnd}</strong>, with estimated ovulation around <strong>${ovulationDate}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/dashboard" style="background-color: #E85D9A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Luna</a>
        </div>
        <p style="color: #777777; font-size: 12px; text-align: center;"><a href="${appUrl}/profile">Manage Notifications</a></p>
      </div>
    `,
    text: `Your fertile window is starting (between ${fertileStart} and ${fertileEnd}).`
  };
}

export function weeklyInsightsEmail({ displayName, insightsSummary, streakDays, appUrl }: { displayName: string, insightsSummary: string[], streakDays: number, appUrl: string }) {
  return {
    subject: "Your Luna weekly summary",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #4A1B3C; text-align: center;">Weekly Summary for ${displayName}</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">You're currently on a <strong>${streakDays}-day</strong> tracking streak! Awesome job keeping in touch with your rhythm.</p>
        <ul>
          ${insightsSummary.map(i => `<li style="color: #333333; font-size: 16px; line-height: 1.5;">${i}</li>`).join('')}
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/dashboard" style="background-color: #E85D9A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View More in Luna</a>
        </div>
        <p style="color: #777777; font-size: 12px; text-align: center;"><a href="${appUrl}/profile">Configure weekly emails</a></p>
      </div>
    `,
    text: `Weekly summary: Streak: ${streakDays} days. ${insightsSummary.join('. ')}`
  };
}

export function dataExportReadyEmail({ displayName, downloadUrl, expiresAt }: { displayName: string, downloadUrl: string, expiresAt: string }) {
  return {
    subject: "Your Luna data export is ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #4A1B3C;">Your Data is Ready</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Hi ${displayName},</p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">You recently requested a complete export of your personal Luna data. You can download the secure ZIP or JSON file using the button below. This link will safely expire at <strong>${expiresAt}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${downloadUrl}" style="background-color: #4A1B3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download My Data</a>
        </div>
        <p style="color: #777777; font-size: 14px; padding-top: 10px; border-top: 1px solid #eee;"><strong>Security alert:</strong> If you did not request this data export, please contact us immediately to secure your account.</p>
      </div>
    `,
    text: `Your Luna data export is ready. Download it here: ${downloadUrl}. It expires at ${expiresAt}.`
  };
}

export function accountDeletionConfirmEmail({ displayName, scheduledAt, cancellationUrl }: { displayName: string, scheduledAt: string, cancellationUrl: string }) {
  return {
    subject: "Your Luna account will be deleted",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #4A1B3C;">Account Deletion Scheduled</h1>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Hi ${displayName},</p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">We have received your requested instruction to permanently delete your Luna account and all associated personal data.</p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5;">Your account is queued for permanent deletion on <strong>${scheduledAt}</strong>.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #fff0f0; border-radius: 8px;">
          <p style="color: #333333; font-size: 14px; margin-top: 0;">Changed your mind? You can cancel the deletion within the next 24 hours.</p>
          <a href="${cancellationUrl}" style="background-color: #E85D9A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Cancel Deletion</a>
        </div>
        <p style="color: #777777; font-size: 14px;">We hope to see you again someday. Be well.</p>
      </div>
    `,
    text: `Your account deletion is scheduled for ${scheduledAt}. To cancel, visit: ${cancellationUrl}`
  };
}
