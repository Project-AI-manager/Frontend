import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", ".next-dev/**", "node_modules/**", "out/**", "build/**"],
  },
];

export default eslintConfig;
