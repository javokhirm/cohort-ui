import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository's non-React packages.
 *
 * @param {{ tsconfigRootDir: string }} options - `tsconfigRootDir` must be the
 *   consuming project's own directory. Pass `import.meta.dirname` from that
 *   project's `eslint.config.*` so typescript-eslint resolves tsconfigs from the
 *   right root instead of trying (and failing) to infer it across the monorepo.
 * @returns {import("eslint").Linter.Config[]}
 * */
export const config = ({ tsconfigRootDir }) => [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
      },
    },
  },
  {
    ignores: ["dist/**"],
  },
];
