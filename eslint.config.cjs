const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const tseslint = require('typescript-eslint');
const pluginImport = require('eslint-plugin-import');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'crm-agent-runner', 'apps/api/dist', 'apps/web/.next', 'apps/web/out'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...compat.config(pluginImport.configs.recommended),
  ...compat.config(pluginImport.configs.typescript),
  {
    files: ['apps/api/src/**/*.{ts,tsx}', 'apps/api/tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './apps/api/tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
    plugins: {
      import: pluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    files: ['apps/api/prisma/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './apps/api/tsconfig.prisma.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
    plugins: {
      import: pluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  }
  ,
  {
    files: ['apps/api/tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './apps/api/tsconfig.tests.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
    plugins: {
      import: pluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  }
);
