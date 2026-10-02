import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "build/**", "coverage/**"]
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    files: ["tests/**/*.mjs"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-this-alias": "off"
    }
  }
];

export default eslintConfig;
