import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendResetPasswordEmailParams {
  to: string;
  url: string;
}

export async function sendResetPasswordEmail({ to, url }: SendResetPasswordEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const { error } = await resend.emails.send({
    from,
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

  if (error) {
    throw new Error(`Failed to send reset password email: ${error.message}`);
  }
}
