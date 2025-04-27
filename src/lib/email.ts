import "dotenv/config";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";

import env from "@/env";
import { generateUserVerificationJWT } from "@/lib/jwt";

export async function sendVerificationEmail({ userId, email }: { userId: string; email: string }) {
  const mailerSend = new MailerSend({
    apiKey: env.MAILERSEND_API_TOKEN,
  });

  const sentFrom = new Sender(env.MAILERSEND_EMAIL);

  const recipients = [
    new Recipient(email),
  ];

  const verifyEmailToken = await generateUserVerificationJWT({ sub: userId });

  const verifyEmailLink = `${env.FRONTEND_URL}/verify-email?token=${verifyEmailToken}`;

  const personalization = [
    {
      email,
      data: {
        // TODO: add a real support email
        support_email: "test@test.com",
        verify_email_link: verifyEmailLink,
      },
    },
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setTemplateId(env.MAILERSEND_TEMPLATE_ID)
    .setPersonalization(personalization);

  await mailerSend.email.send(emailParams);
}
