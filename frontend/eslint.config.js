import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import litPlugin from 'eslint-plugin-lit';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['**/*.ts'],
        plugins: {
            lit: litPlugin,
        },
        rules: {
            ...litPlugin.configs.recommended.rules,
        },
    },
    {
        ignores: ['node_modules/**', 'dist/**', '*.config.js', '*.config.ts'],
    },
    prettierConfig,
);
