import nodemailer from 'nodemailer'

const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  await transporter.sendMail({
    from: `"Thân gửi từ Trip Planner" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

export default sendEmail
