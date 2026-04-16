type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

type VerificationEmailInput = {
  to: string;
  verifyUrl: string;
};

type InviteEmailInput = {
  to: string;
  orgName: string;
  role: string;
  inviteUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailInput) {
  // Replace with your actual mail provider.
  console.log("sendPasswordResetEmail", { to, resetUrl });
}

export async function sendVerificationEmail({
  to,
  verifyUrl,
}: VerificationEmailInput) {
  // Replace with your actual mail provider.
  console.log("sendVerificationEmail", { to, verifyUrl });
}

export async function sendInviteEmail({
  to,
  orgName,
  role,
  inviteUrl,
}: InviteEmailInput) {
  // Replace with your actual mail provider.
  console.log("sendInviteEmail", { to, orgName, role, inviteUrl });
}