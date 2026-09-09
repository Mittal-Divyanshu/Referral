import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Engineering rule: no `any`. If a type is genuinely unknown, use
      // `unknown` and narrow it. Escaping this needs an explicit, justified
      // eslint-disable comment so it shows up in review.
      "@typescript-eslint/no-explicit-any": "error",

      // Unused code is usually a leftover from a refactor. Allow a leading
      // underscore to mark an intentionally unused binding.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    // Environment variables are validated once in lib/env.ts. Reading
    // process.env anywhere else bypasses that and silently reintroduces
    // `string | undefined` into the codebase.
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
    ],
    ignores: ["lib/env.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Import validated config from '@/lib/env' instead of reading process.env directly.",
        },
      ],
    },
  },

  // Must come last so formatting-related rules are switched off and Prettier
  // stays the single source of truth for style.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
