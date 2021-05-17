import { ESLint } from 'eslint';

const EslintConfig: ESLint.Options = {
  allowInlineConfig: true,
  cache: false,
  errorOnUnmatchedPattern: true,
  extensions: ['.tsx', '.ts'],
  fix: true,
  fixTypes: undefined,
  ignore: true,
  ignorePath: undefined,
  overrideConfig: {
    env: undefined,
    globals: undefined,
    ignorePatterns: undefined,
    parser: '@typescript-eslint/parser',
    parserOptions: {},
    plugins: ['chanjet-rules', 'unused-imports', '@typescript-eslint'],
    rules: {
      'unused-imports/no-unused-imports-ts': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'chanjet-rules/fix-import-type': 'error',
      'chanjet-rules/prefer-alias-path': ['error', {}],
    },
  },
  // overrideConfigFile: clidir('.eslintrc.js'),
  reportUnusedDisableDirectives: undefined,
  resolvePluginsRelativeTo: undefined,
  useEslintrc: false,
};

const eslint = new ESLint(EslintConfig);

async function transform(filePath: string) {
  const results = await eslint.lintFiles([filePath]);
  await ESLint.outputFixes(results);
  console.log(filePath);
  return filePath;
}

module.exports = transform;
module.exports.transform = transform;