async function sendTransactionalEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Email provider rejected delivery (${response.status}).`);
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  await sendTransactionalEmail(to, "Reset your EstateDesk password", `Reset your password using this link (expires in one hour):\n${resetUrl}\nIf you did not request this, ignore this email.`);
}
export async function sendVerificationEmail({ to, verifyUrl }: { to: string; verifyUrl: string }) {
  await sendTransactionalEmail(to, "Verify your EstateDesk email", `Confirm your email using this link (expires in 24 hours):\n${verifyUrl}`);
}
export async function sendInviteEmail({ to, orgName, role, inviteUrl }: { to: string; orgName: string; role: string; inviteUrl: string }) {
  await sendTransactionalEmail(to, `Join ${orgName} on EstateDesk`, `You have been invited to ${orgName} as ${role}.\n${inviteUrl}`);
}
