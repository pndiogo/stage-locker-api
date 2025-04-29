import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/routes/auth/auth.index";
import index from "@/routes/index.route";

const app = createApp();

configureOpenAPI(app);

const routes = [
  index,
  auth,
] as const;

routes.forEach((route) => {
  app.route("/api/v1", route);
});

export type AppType = typeof routes[number];

export default app;
