import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,      // your-email@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD,  // 16-char password from Google
  },
})

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"Luna" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    })
    
    console.log('Email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Gmail send error:', error)
    return false
  }
}
