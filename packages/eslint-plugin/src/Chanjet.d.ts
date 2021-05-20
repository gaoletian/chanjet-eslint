import type { RuleListener, RuleContext as RawRuleContext } from '@typescript-eslint/experimental-utils/dist/ts-eslint';
export * from '@typescript-eslint/experimental-utils/dist/ts-eslint';
export * from '@typescript-eslint/types';

export type ChanjetRuleModule<TOption = unknown> = {
  create(context: RawRuleContext<string, TOption[]>): RuleListener;
};
export type RuleContext = RawRuleContext<string, unknown[]>;

export as namespace Chanjet;
