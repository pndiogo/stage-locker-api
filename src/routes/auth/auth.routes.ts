import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { insertUserchema, loginUserchema, loginUserchemaResponse, selectUserSchema } from "@/db/schema/auth";
import { badRequestSchema, forbiddenSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";
import { authenticate } from "@/middlewares/authenticate";

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
  },
});

export const login = createRoute({
  path: "/auth/login",
  method: "post",
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
  request: {
    params: IdUUIDParamsSchema,
    headers: z.object({
      Authorization: z.string().optional(),
    }),
  },
  tags,
  middleware: [authenticate],
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

export type GetUserRoute = typeof getUser;
// export type ListUsersRoute = typeof listUsers;
export type LoginRoute = typeof login;
export type SignupRoute = typeof signup;
// export type PatchRoute = typeof patch;
// export type RemoveRoute = typeof remove;
