import { ESLint } from 'eslint';
import { writeDomainExpose } from '@chanjet/eslint-utils';

let eslint: ESLint;

function createEslintConfig(rules: Record<string, string | string[]>) {
  return {
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
      plugins: ['@chanjet/eslint-plugin', 'unused-imports', '@typescript-eslint'],
      rules,
    },
    reportUnusedDisableDirectives: undefined,
    resolvePluginsRelativeTo: undefined,
    useEslintrc: false,
  } as ESLint.Options;
}

export async function transform(filePath: string, option: Record<string, string> = {}) {
  if (!eslint) {
    const defaultRules = {
      'unused-imports/no-unused-imports-ts': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@chanjet/fix-import-type': 'off',
    };
    // 自定义rule规则
    const rules = option.rules ? require(option.rules) : defaultRules;

    eslint = new ESLint(createEslintConfig(rules));
  }
  const results = await eslint.lintFiles([filePath]);
  if (option?.fixed) {
    await ESLint.outputFixes(results);
  }
  console.log(filePath);
  return results;
}

export async function finised() {
  await writeDomainExpose();
}
