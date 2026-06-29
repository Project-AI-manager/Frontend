// Генерация типобезопасного клиента из OpenAPI бэкенда (на axios).
// Запуск: pnpm api:gen (когда бэкенд отдаёт /api/v1/openapi.json).
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:8000/openapi.json",
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
