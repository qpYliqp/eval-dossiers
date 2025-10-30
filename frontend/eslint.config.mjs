import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: pluginImport
    },
    rules: {
      // CamelCase pour les variables, fonctions et méthodes
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "variableLike", "format": ["camelCase"] },
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "parameter", "format": ["camelCase"] },
        { "selector": "method", "format": ["camelCase"] },

        // PascalCase pour les classes et interfaces
        { "selector": "class", "format": ["PascalCase"] },
        { "selector": "interface", "format": ["PascalCase"] }
      ],

      // Interdiction de l'utilisation de var
      "no-var": "error",

      // Vérification de l'ordre des imports
      "sort-imports": ["error", { "ignoreCase": true, "ignoreDeclarationSort": true }],

      // Forcer l'utilisation de === au lieu de ==
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