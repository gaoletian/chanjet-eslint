import { ESLint, Linter } from 'eslint';
import { promisify } from 'util';
import { readFile } from 'fs';
import path from 'path';

function getOption(rules: Linter.RulesRecord): ESLint.Options {
  return {
    allowInlineConfig: true,
    cache: false,
    errorOnUnmatchedPattern: true,
    extensions: ['.tsx', '.ts'],
    fix: true,
    fixTypes: undefined,
    overrideConfig: {
      plugins: ['@chanjet/eslint-rules'],
      parser: '@typescript-eslint/parser',
      rules,
    },
    // rulePaths: [path.resolve(__dirname, '../dist/rules')],
    resolvePluginsRelativeTo: undefined,
    useEslintrc: false,
  };
}

export const createESlint = (rules: Linter.RulesRecord) => new ESLint(getOption(rules));

export const readfileAsync = promisify(readFile);
export const fixtureResolve = (filename: string) => path.resolve(__dirname, filename);
