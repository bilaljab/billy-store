import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // no-require-imports downgraded to warn: intentional dynamic require() workaround in lib/db.ts.
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
];

export default eslintConfig;
