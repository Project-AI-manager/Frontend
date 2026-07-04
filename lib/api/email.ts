import { getEmail } from "./generated/email/email";

const emailClient = getEmail();

export const emailApi = {
  getStatus: () => emailClient.statusApiV1EmailStatusGet(),
  requestVerification: () =>
    emailClient.requestVerificationApiV1EmailVerificationRequestPost(),
  confirmVerification: (token: string) =>
    emailClient.confirmVerificationApiV1EmailVerificationConfirmPost({ token }),
  requestPasswordReset: (email: string) =>
    emailClient.requestResetApiV1EmailPasswordResetRequestPost({ email }),
  confirmPasswordReset: (token: string, newPassword: string) =>
    emailClient.confirmResetApiV1EmailPasswordResetConfirmPost({
      token,
      new_password: newPassword,
    }),
  getOutbox: () => emailClient.outboxApiV1EmailOutboxGet(),
};
