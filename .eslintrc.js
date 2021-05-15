/* eslint-disable no-undef */
module.exports = {
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  // parserOptions: {
  //   ecmaVersion: 12,
  //   sourceType: 'module',
  // },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
