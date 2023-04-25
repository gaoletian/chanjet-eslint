export * from '@typescript-eslint/types';
import type { RuleContext as RawRuleContext, RuleListener } from '@typescript-eslint/utils/dist/ts-eslint/Rule';

export type ChanjetRuleModule<TOption = unknown> = {
  create(context: RawRuleContext<string, TOption[]>): RuleListener;
};
export type RuleContext = Record<string, unknown[]>;

export as namespace Chanjet;
