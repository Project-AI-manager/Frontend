// Генерация типобезопасного клиента из OpenAPI бэкенда (на axios).
// Запуск: pnpm api:gen (когда бэкенд отдаёт /api/v1/openapi.json).
import { defineConfig } from "orval";

const input = process.env.OPENAPI_INPUT ?? "http://localhost:8000/openapi.json";

export default defineConfig({
  api: {
    input,
    output: {
      mode: "tags-split",
      target: "lib/api/generated",
      client: "axios",
      override: {
        mutator: { path: "lib/api/client.ts", name: "apiClient" },
      },
    },
  },
});
