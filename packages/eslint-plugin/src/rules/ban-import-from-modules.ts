import { TSESTree } from '@typescript-eslint/types';
import { isImportType, isRequireContextExpression, isRequireExpression } from '../astUtil';
import { getModuleFullPath } from '@chanjet/eslint-utils';

export default <Chanjet.ChanjetRuleModule<{ target: RegExp; from: RegExp }>>{
  create(context) {
    const currentFile = context.getFilename();
    const options = context.options[0];
    const message = '禁止公共代码与业务代码耦合';
    const sourceCode = context.getSourceCode();

    const report = (node: Chanjet.TSESTree.Node, message: string) => {
      // @ts-ignore
      context.report({ node, message });
    };

    const check = (node: TSESTree.Node) => {
      const moduleFullPath = getModuleFullPath(sourceCode.getText(node), currentFile);
      if (options.from.test(moduleFullPath as string)) {
        report(node, [moduleFullPath, message].join(','));
      }
    };

    if (!options.target.test(currentFile)) return {};

    return {
      /* ---------------------------- 静态导入 Import From ---------------------------- */

      ImportDeclaration(node) {
        if (isImportType(node)) return;
        check(node);
      },

      /* ------------------------------ 动态导入 Import() ----------------------------- */

      ImportExpression(node) {
        check(node);
      },

      /* --------------------------- Commonjs Require() --------------------------- */

      CallExpression(node) {
        if (isRequireExpression(node) || isRequireContextExpression(node)) {
          check(node);
        }
      },
      ExportNamedDeclaration(node) {
        check(node);
      },
      ExportAllDeclaration(node) {
        check(node);
      },
    };
  },
};
