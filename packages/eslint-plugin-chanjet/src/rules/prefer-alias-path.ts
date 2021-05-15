import { TSESTree } from '@typescript-eslint/types';
import { isRequireContextExpression, isRequireExpression, useReplaceNode } from '../astUtil';
import {
  getAliasOrRelativeRegex,
  getModuleDirPath,
  getModuleFullPath,
  toRelativePath,
  toSrcAliasPath,
} from '../pathUtil';

let fixedCache = new Set<string>();

export default <Chanjet.ChanjetRuleModule<{ target: RegExp; from: RegExp }>>{
  create(context) {
    const currentFile = context.getFilename();
    const message = '跨目录引用优先使用别名路径';
    const sourceCode = context.getSourceCode();
    const fileModuleDir = getModuleDirPath(currentFile);
    const srcDirFullPath = currentFile.split('/src/')[0] + '/src';

    const replaceNode = useReplaceNode(context, message);

    const toAliasPath = (node: TSESTree.Node) => {
      const nodeText = sourceCode.getText(node);

      if (fixedCache.has(nodeText)) return;

      const moduleFullPath = getModuleFullPath(nodeText, currentFile);
      const moduleDirPath = getModuleDirPath(moduleFullPath);
      // prettier-ignore
      const newModulePath = moduleDirPath !== fileModuleDir
          ? toSrcAliasPath(moduleFullPath, srcDirFullPath) // 跨目录转换为src别名路径
          : toRelativePath(currentFile, moduleFullPath); // 相同模块目录使用相对路径

      const RawModulePathRegexp = getAliasOrRelativeRegex();
      const nodeTextFixed = nodeText.replace(RawModulePathRegexp, (RawModulePath) => {
        if (RawModulePath[RawModulePath.length - 2] === '/') {
          return RawModulePath[0] + newModulePath + RawModulePath.slice(-2);
        } else {
          return RawModulePath[0] + newModulePath + RawModulePath.slice(-1);
        }
      });

      fixedCache.add(nodeTextFixed);
      replaceNode(node, nodeTextFixed);
    };

    return {
      /* ---------------------------- 静态导入 Import From ---------------------------- */

      ImportDeclaration(node) {
        toAliasPath(node);
      },

      /* ------------------------------ 动态导入 Import() ----------------------------- */

      ImportExpression(node) {
        toAliasPath(node);
      },

      /* ----------------- Commonjs require() Or require.context() ---------------- */

      CallExpression(node) {
        if (isRequireExpression(node) || isRequireContextExpression(node)) {
          toAliasPath(node);
        }
      },
    };
  },
};
