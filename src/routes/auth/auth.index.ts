import { createRouter } from "@/lib/create-app";

import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const router = createRouter()
  .openapi(routes.signup, handlers.signup)
  .openapi(routes.login, handlers.login)
  .openapi(routes.getUser, handlers.getUser);
// .openapi(routes.listUsers, handlers.listUsers)

export default router;
