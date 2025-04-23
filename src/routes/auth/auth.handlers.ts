import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { selectUserSchema, users } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import { signJwt } from "@/lib/jwt";

import type { GetUserRoute, LoginRoute, SignupRoute } from "./auth.routes";

export const signup: AppRouteHandler<SignupRoute> = async (c) => {
  const user = c.req.valid("json");

  const existingUser = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, user.email);
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

  const hashedPassword = await hash(user.password, 10);

  const [inserted] = await db.insert(users).values({
    ...user,
    password: hashedPassword,
  }).returning();

  const sanitizedUser = selectUserSchema.parse(inserted);

  return c.json(sanitizedUser, HttpStatusCodes.CREATED);
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

  const token = await signJwt({ sub: user.id });

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
