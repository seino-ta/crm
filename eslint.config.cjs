const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const tseslint = require('typescript-eslint');
const pluginImport = require('eslint-plugin-import');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'crm-agent-runner'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...compat.config(pluginImport.configs.recommended),
  ...compat.config(pluginImport.configs.typescript),
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
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
