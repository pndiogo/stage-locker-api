import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { selectUserSchema, users } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import { sendPasswordResetEmailToUser, sendVerificationEmailToUser } from "@/lib/email";
import { generateLoginJWT, generateUserVerificationJWT, verifyJWT } from "@/lib/jwt";

import type { GetUserRoute, LoginRoute, ResetPasswordRoute, SendPasswordResetEmailRoute, SendVerificationEmailRoute, SignupRoute, VerifyEmailRoute } from "./auth.routes";

export const signup: AppRouteHandler<SignupRoute> = async (c) => {
  const user = c.req.valid("json");
  const { email, password } = user;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, normalizedEmail);
    },
  });

  if (existingUser) {
    return c.json(

      {
        message: HttpStatusPhrases.BAD_REQUEST,
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const hashedPassword = await hash(password, 10);

  const [inserted] = await db.insert(users).values({
    ...user,
    email: normalizedEmail,
    password: hashedPassword,
  }).returning();

  const sanitizedUser = selectUserSchema.parse(inserted);
  const verificationToken = await generateUserVerificationJWT({ sub: sanitizedUser.id });

  try {
    await sendVerificationEmailToUser({
      email: sanitizedUser.email,
      verificationToken,
    });

    await db.update(users)
      .set({ verificationToken })
      .where(eq(users.id, sanitizedUser.id));
  }
  catch (error) {
    console.error("Error sending verification email:", error);

    await db.update(users)
      .set({ verificationToken: null })
      .where(eq(users.id, sanitizedUser.id));

    return c.json(
      {
        message: "Error sending verification email",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return c.json(sanitizedUser, HttpStatusCodes.CREATED);
};

export const verifyEmail: AppRouteHandler<VerifyEmailRoute> = async (c) => {
  const token = c.req.valid("query").token;

  const payload = await verifyJWT(token);

  if (!payload) {
    return c.json(
      { message: "Invalid or expired token" },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.verificationToken, token);
    },
  });

  if (!user) {
    return c.json(
      { message: "User not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  await db.update(users)
    .set({ verified: true, verificationToken: null })
    .where(eq(users.id, user.id));

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const sendVerificationEmail: AppRouteHandler<SendVerificationEmailRoute> = async (c) => {
  const { email } = c.req.valid("json");

  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, normalizedEmail);
    },
  });

  if (!user) {
    return c.json(
      { message: "User not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (user.verified) {
    return c.json(
      { message: "Email is already verified" },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const verificationToken = await generateUserVerificationJWT({ sub: user.id });

  console.log("🚀 ~ constsendVerificationEmail:AppRouteHandler<SendVerificationEmailRoute>= ~ verificationToken:", verificationToken);
  try {
    // await sendVerificationEmailToUser({
    //   email: user.email,
    //   verificationToken,
    // });

    await db.update(users)
      .set({ verificationToken })
      .where(eq(users.id, user.id));
  }
  catch (error) {
    console.error("Error sending verification email:", error);

    await db.update(users)
      .set({ verificationToken: null })
      .where(eq(users.id, user.id));

    return c.json(
      {
        message: "Error sending verification email",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return c.json(
    { message: "Verification email sent" },
    HttpStatusCodes.OK,
  );
};

export const sendPasswordResetEmail: AppRouteHandler<SendPasswordResetEmailRoute> = async (c) => {
  const { email } = c.req.valid("json");

  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, normalizedEmail);
    },
  });

  if (!user) {
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  }

  const passwordResetToken = await generateUserVerificationJWT({ sub: user.id });

  try {
    await sendPasswordResetEmailToUser({
      email: user.email,
      passwordResetToken,
    });

    await db.update(users)
      .set({ passwordResetToken })
      .where(eq(users.id, user.id));
  }
  catch (error) {
    console.error("Error sending password reset email:", error);

    await db.update(users)
      .set({ verificationToken: null })
      .where(eq(users.id, user.id));

    return c.json(
      {
        message: "Error sending password reset email",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const resetPassword: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  const { token, newPassword } = c.req.valid("json");

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.passwordResetToken, token);
    },
  });

  if (!user) {
    return c.json(
      { message: "Invalid or expired token" },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const hashedPassword = await hash(newPassword, 10);

  await db.update(users)
    .set({ password: hashedPassword, passwordResetToken: null })
    .where(eq(users.id, user.id));

  return c.json(
    { message: "Password successfully updated" },
    HttpStatusCodes.OK,
  );
};

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email);
    },
  });

  if (!user) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const isValidPassword = await compare(password, user.password);

  if (!isValidPassword) {
    return c.json(
      {
        message: HttpStatusPhrases.UNAUTHORIZED,
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const token = await generateLoginJWT({ sub: user.id });

  const sanitizedUser = selectUserSchema.parse(user);

  return c.json({
    ...sanitizedUser,
    token,
  }, HttpStatusCodes.OK);
};

export const getUser: AppRouteHandler<GetUserRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.var.user.id;

  if (userId !== id) {
    return c.json(
      { message: "Forbidden: You are not allowed to access this resource" },
      HttpStatusCodes.FORBIDDEN,
    );
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!user) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const sanitizedUser = selectUserSchema.parse(user);

  return c.json(sanitizedUser, HttpStatusCodes.OK);
};

// export const listUsers: AppRouteHandler<ListUsersRoute> = async (c) => {
//   const users = await db.query.users.findMany();

//   const sanitizedUsers = users.map(user => selectUserSchema.parse(user));

//   return c.json(sanitizedUsers, HttpStatusCodes.OK);
// };

// export const patch: AppRouteHandler<PatchRoute> = async (c) => {
//   const { id } = c.req.valid("param");
//   const updates = c.req.valid("json");

//   if (Object.keys(updates).length === 0) {
//     return c.json(
//       {
//         success: false,
//         error: {
//           issues: [
//             {
//               code: ZOD_ERROR_CODES.INVALID_UPDATES,
//               path: [],
//               message: ZOD_ERROR_MESSAGES.NO_UPDATES,
//             },
//           ],
//           name: "ZodError",
//         },
//       },
//       HttpStatusCodes.UNPROCESSABLE_ENTITY,
//     );
//   }

//   const [task] = await db.update(tasks)
//     .set(updates)
//     .where(eq(tasks.id, id))
//     .returning();

//   if (!task) {
//     return c.json(
//       {
//         message: HttpStatusPhrases.NOT_FOUND,
//       },
//       HttpStatusCodes.NOT_FOUND,
//     );
//   }

//   return c.json(task, HttpStatusCodes.OK);
// };

// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//   const { id } = c.req.valid("param");
//   const result = await db.delete(tasks)
//     .where(eq(tasks.id, id));

//   if (result.rowsAffected === 0) {
//     return c.json(
//       {
//         message: HttpStatusPhrases.NOT_FOUND,
//       },
//       HttpStatusCodes.NOT_FOUND,
//     );
//   }

//   return c.body(null, HttpStatusCodes.NO_CONTENT);
// };
