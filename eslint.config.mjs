import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat-config arrays, so we spread them
// directly (no @eslint/eslintrc FlatCompat shim, which breaks under ESLint 9).
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
