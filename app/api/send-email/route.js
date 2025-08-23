import nodemailer from 'nodemailer'

export async function POST(req) {
  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, and (html or text)" }), { status: 400 })
    }

    // Create Gmail transporter
    // You'll need to set these environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not your regular password)
      }
    })

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text
    }

    const result = await transporter.sendMail(mailOptions)

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      message: "Email sent successfully"
    }), { status: 200 })

  } catch (err) {
    console.error("[API][Send-Email][POST] Error:", err)
    return new Response(JSON.stringify({
      error: "Failed to send email",
      details: err.message
    }), { status: 500 })
  }
}
