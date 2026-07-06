import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendResetPasswordEmailParams {
  to: string;
  url: string;
}

export async function sendResetPasswordEmail({ to, url }: SendResetPasswordEmailParams): Promise<void> {
  const from = process.env.GMAIL_USER;
  if (!from) {
    throw new Error("GMAIL_USER is not configured");
  }

  await transporter.sendMail({
    from: `"Have You" <${from}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Someone requested a password reset for your account. If this was you, click the link below to choose a new password.</p>
        <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">Reset password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
