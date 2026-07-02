import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * A shared ESLint configuration for the React + Vite single-page apps
 * (e.g. staff, admin).
 *
 * @param {{ tsconfigRootDir: string }} options - `tsconfigRootDir` must be the
 *   consuming app's own directory. Pass `import.meta.dirname` from that app's
 *   `eslint.config.js` so typescript-eslint resolves tsconfigs from the right
 *   root instead of inferring it across the monorepo.
 * @returns {import("eslint").Linter.Config[]}
 * */
export const config = ({ tsconfigRootDir }) =>
  defineConfig([
    globalIgnores(["dist"]),
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        globals: globals.browser,
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
  ]);
