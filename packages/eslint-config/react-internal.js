import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A shared ESLint configuration for internal React libraries (e.g. @repo/ui).
 *
 * @param {{ tsconfigRootDir: string }} options - forwarded to the base config;
 *   pass `import.meta.dirname` from the consuming project's `eslint.config.*`.
 * @returns {import("eslint").Linter.Config[]}
 * */
export const config = ({ tsconfigRootDir }) => [
  ...baseConfig({ tsconfigRootDir }),
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React scope no longer necessary with the new JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
];
