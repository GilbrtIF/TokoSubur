// apps/api/eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import pluginN from 'eslint-plugin-n';
import airbnbBase from 'airbnb-eslint9';
import stylistic from '@stylistic/eslint-plugin'; // ✅ Import plugin
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1. Abaikan folder yang tidak perlu di-lint
  {
    ignores: ['node_modules/', 'migrations/', 'dist/', 'coverage/'],
  },

  // 2. Konfigurasi dasar JavaScript
  js.configs.recommended,

  // 3. Konfigurasi khusus Node.js
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      n: pluginN,
    },
    rules: {
      ...pluginN.configs['flat/recommended'].rules,
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-process-exit': 'off',
    },
  },

  // 4. ✅ Daftarkan plugin @stylistic SEBELUM aturan Airbnb
  {
    plugins: {
      '@stylistic': stylistic,
    },
  },

  // 5. Aturan gaya Airbnb
  ...airbnbBase,

  // 6. Matikan aturan ESLint yang berpotensi konflik dengan Prettier
  eslintConfigPrettier,
];