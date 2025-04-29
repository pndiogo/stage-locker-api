import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import packageJson from "../../package.json" with { type: "json" };

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/api/v1/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJson.version,
      title: "Stage Locker API V1",
    },
  });

  app.get(
    "/api/v1/reference",
    Scalar({
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      url: "/api/v1/doc",
    }),
  );
}
