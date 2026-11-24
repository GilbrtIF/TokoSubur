
// apps/api/eslint.config.mjs

import js from '@eslint/js';
import globals from 'globals';
import pluginN from 'eslint-plugin-n';
import airbnbBase from 'airbnb-eslint9';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-next';

export default [
  // 1. Abaikan folder dan file yang tidak perlu di-lint
  {
    ignores: [
      'node_modules/',
      'migrations/',
      'dist/',
      'coverage/',
    ],
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
      '@stylistic': stylistic,
      import: importPlugin,
      n: pluginN,
    },

    rules: {
      ...pluginN.configs['flat/recommended'].rules,

      // Console diperbolehkan dengan warning
      'no-console': 'warn',

      // Memeriksa variabel yang tidak digunakan
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      // Menonaktifkan aturan process.exit
      'n/no-process-exit': 'off',
    },
  },

  // 4. Registrasi plugin Stylistic
  {
    plugins: {
      '@stylistic': stylistic,
    },
  },

  // 5. Aturan gaya Airbnb
  ...airbnbBase,

  // 6. Pengecualian khusus file konfigurasi ESLint
  {
    files: ['eslint.config.mjs'],

    rules: {
      // Izinkan devDependencies pada file konfigurasi
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['eslint.config.mjs'],
        },
      ],

      // File konfigurasi tidak dianggap sebagai source
      // yang dipublikasikan oleh package aplikasi
      'n/no-unpublished-import': 'off',
    },
  },

  // 7. Nonaktifkan aturan yang bertentangan dengan Prettier
  eslintConfigPrettier,
];
