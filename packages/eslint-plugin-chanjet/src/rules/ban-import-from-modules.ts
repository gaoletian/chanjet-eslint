import { isRequireContextExpression, isRequireExpression } from '../astUtil';
import { getModuleFullPath } from '../pathUtil';

export default <Chanjet.ChanjetRuleModule<{ target: RegExp; from: RegExp }>>{
  create(context) {
    const currentFile = context.getFilename();
    const options = context.options[0];
    const message = '禁止公共代码与业务代码耦合';

    const report = (node: Chanjet.TSESTree.Node) => {
      // @ts-ignore
      context.report({ node, message });
    };

    if (!options.target.test(currentFile)) return {};

    const sourceCode = context.getSourceCode();

    return {
      /* ---------------------------- 静态导入 Import From ---------------------------- */

      ImportDeclaration(node) {
        const moduleFullPath = getModuleFullPath(sourceCode.getText(node), currentFile);
        if (options.from.test(moduleFullPath)) {
          report(node);
        }
      },

      /* ------------------------------ 动态导入 Import() ----------------------------- */

      ImportExpression(node) {
        const moduleFullPath = getModuleFullPath(sourceCode.getText(node), currentFile);
        if (options.from.test(moduleFullPath)) {
          report(node);
        }
      },

      /* --------------------------- Commonjs Require() --------------------------- */

      CallExpression(node) {
        if (isRequireExpression(node) || isRequireContextExpression(node)) {
          const moduleFullPath = getModuleFullPath(sourceCode.getText(node), currentFile);
          if (options.from.test(moduleFullPath)) {
            report(node);
          }
        }
      },
    };
  },
};
