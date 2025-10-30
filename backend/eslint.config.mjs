import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: pluginImport
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "variableLike", "format": ["camelCase"] },
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "parameter", "format": ["camelCase"] },
        { "selector": "method", "format": ["camelCase"] },
        { "selector": "class", "format": ["PascalCase"] },
        { "selector": "interface", "format": ["PascalCase"] }
      ],
      "no-var": "error",
      "sort-imports": ["error", { "ignoreCase": true, "ignoreDeclarationSort": true }],
      "eqeqeq": ["error", "always"],
      "no-warning-comments": ["warn", {
        "terms": ["TODO", "FIXME"],
        "location": "start"
      }],
      "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }],
      "import/no-unused-modules": [1, { "unusedExports": true }]
    }
  }
];