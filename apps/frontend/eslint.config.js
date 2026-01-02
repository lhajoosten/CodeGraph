import reactRefresh from "eslint-plugin-react-refresh";
import reactCompiler from "eslint-plugin-react-compiler";
import react19Upgrade from "eslint-plugin-react-19-upgrade";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/",
      "eslint.config.js",
      "eslint.config.mjs",
      "**/openapi-ts.config.ts",
      ".husky/",
      "src/openapi/**/*",
      "coverage/", // ignore coverage output
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactRefresh.configs.vite,
  {
    plugins: {
      "react-compiler": reactCompiler,
      "react-19-upgrade": react19Upgrade,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        process: true,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },

    settings: {
      "better-tailwindcss": {
        entryPoint: "src/index.css",
      },
      react: {
        createClass: "createReactClass",
        pragma: "React",
        fragment: "Fragment",
        version: "detect",
        flowVersion: "0.53",
      },

      propWrapperFunctions: [],
      componentWrapperFunctions: [],
      formComponents: [],
      linkComponents: [],
    },

    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,
      // Disable line wrapping rule - Prettier handles this
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/no-unregistered-classes": [
        "warn",
        {
          ignore: [
            "^recharts-.+",
            // Radix UI data attribute animations
            "^data-\\[state=.+\\]:.+",
            "^data-\\[side=.+\\]:.+",
            // Animation utilities
            "^animate-.+",
            "^fade-.+",
            "^zoom-.+",
            "^slide-.+",
            // Additional Radix UI and custom utilities
            "^scroll-.+",
            "^\\[&.+",
            // Storybook custom theme
            "^luminous-theme$",
            // Test utility classes
            "^custom-.+",
            // Custom CSS utility classes defined in @layer utilities
            "^interactive$",
            "^interactive-scale$",
            "^focus-ring$",
            "^focus-ring-inset$",
            "^border-accent-top$",
            "^border-accent-left$",
            "^glass$",
            "^glass-subtle$",
            "^bg-gradient-.+",
            "^text-gradient-.+",
            "^glow-.+",
            "^status-.+",
            "^shimmer$",
            "^divider$",
            "^divider-vertical$",
            "^noise$",
            "^truncate-\\d+$",
            // Scrollbar custom class
            "^scroll-area$",
            // Skeleton animation class
            "^hc-skel-item$",
            // Premium animation classes
            "^orb$",
            "^orb-.+",
            "^stagger-\\d+$",
            "^sparkle-.+",
            "^hover-lift-.+",
            "^hover-glow.*",
            "^glass-.+",
            "^border-shine$",
            "^border-accent-animated$",
            "^shimmer-.+",
            "^focus-ring-.+",
            // Storybook luminous theme classes
            ".*-lum$",
            "^bg-bg-steel$",
            "^border-border-steel$",
            "^ring-offset-bg-steel$",
            "^border-border-default-lum$",
            "^active:bg-bg-steel$",
            "^hover:bg-bg-steel$",
          ],
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],

      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-19-upgrade/no-default-props": "error",
      "react-19-upgrade/no-prop-types": "warn",
      "react-19-upgrade/no-legacy-context": "error",
      "react-19-upgrade/no-string-refs": "error",
      "react-19-upgrade/no-factories": "error",
      "react-compiler/react-compiler": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [".storybook/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}", "vitest.config.ts", "vite.config.ts"],
    ignores: [".storybook/**"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
    },
  },
  // Prettier config - must be last to disable conflicting rules
  prettierConfig,
);
