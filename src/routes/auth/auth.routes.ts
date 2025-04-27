import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertUserchema, loginUserchema, loginUserchemaResponse, selectUserSchema } from "@/db/schema/auth";
import { badRequestSchema, forbiddenSchema, internalServerErrorSchema, notFoundSchema, tooManyRequestsSchema, unauthorizedSchema } from "@/lib/constants";
import { authenticate, verifyUserStatus } from "@/middlewares/authenticate";
import { rateLimit } from "@/middlewares/rate-limit";

const tags = ["Auth"];

export const signup = createRoute({
  path: "/auth/signup",
  method: "post",
  request: {
    body: jsonContentRequired(
      insertUserchema,
      "The user to create",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectUserSchema,
      "The created user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertUserchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "User already exists",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      "Internal server error",
    ),
  },
});

export const verifyEmail = createRoute({
  path: "/auth/verify-email",
  method: "get",
  request: {
    query: z.object({
      token: z.string(),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]:
    {
      description: "Email verified",
    },
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Verification token is missing",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Invalid or expired token",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
  },
});

export const resendVerificationEmail = createRoute({
  path: "/auth/resend-verification-email",
  method: "post",
  middleware: [rateLimit(3, 5 * 60 * 1000)], // Limit to 3 requests per 5 minutes
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.string().email("Missing email or invalid email format"),
      }),
      "The user to resend the verification email",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Verification email sent",
    },
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Provided email is already verified or invalid",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({
        email: z.string().email("Invalid email format"),
      })),
      "The validation error(s)",
    ),

    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      "Internal server error",
    ),
  },
});

export const login = createRoute({
  path: "/auth/login",
  method: "post",
  middleware: [verifyUserStatus], // Limit to 3 requests per 5 minutes
  request: {
    body: jsonContentRequired(
      loginUserchema,
      "The user to log in",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      loginUserchemaResponse,
      "The logged in user",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(loginUserchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Invalid credentials",
    ),
  },
});

export const getUser = createRoute({
  path: "/auth/user/{id}",
  method: "get",
  middleware: [authenticate],
  request: {
    params: IdUUIDParamsSchema,
    headers: z.object({
      Authorization: z.string(),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectUserSchema,
      "The requested user",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      "Not allowed to access this resource",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Invalid credentials",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});

// export const listUsers = createRoute({
//   path: "/auth/users",
//   method: "get",
//   tags,
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       z.array(selectUserSchema),
//       "The list of users",
//     ),
//   },
// });

// export const patch = createRoute({
//   path: "/tasks/{id}",
//   method: "patch",
//   request: {
//     params: IdParamsSchema,
//     body: jsonContentRequired(
//       patchTasksSchema,
//       "The task updates",
//     ),
//   },
//   tags,
//   responses: {
//     [HttpStatusCodes.OK]: jsonContent(
//       selectTasksSchema,
//       "The updated task",
//     ),
//     [HttpStatusCodes.NOT_FOUND]: jsonContent(
//       notFoundSchema,
//       "Task not found",
//     ),
//     [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
//       createErrorSchema(patchTasksSchema)
//         .or(createErrorSchema(IdParamsSchema)),
//       "The validation error(s)",
//     ),
//   },
// });

// export const remove = createRoute({
//   path: "/tasks/{id}",
//   method: "delete",
//   request: {
//     params: IdParamsSchema,
//   },
//   tags,
//   responses: {
//     [HttpStatusCodes.NO_CONTENT]: {
//       description: "Task deleted",
//     },
//     [HttpStatusCodes.NOT_FOUND]: jsonContent(
//       notFoundSchema,
//       "Task not found",
//     ),
//     [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
//       createErrorSchema(IdParamsSchema),
//       "Invalid id error",
//     ),
//   },
// });

export type SignupRoute = typeof signup;
export type LoginRoute = typeof login;
export type VerifyEmailRoute = typeof verifyEmail;
export type ResendVerificationEmailRoute = typeof resendVerificationEmail;
export type GetUserRoute = typeof getUser;
// export type ListUsersRoute = typeof listUsers;
// export type PatchRoute = typeof patch;
// export type RemoveRoute = typeof remove;
