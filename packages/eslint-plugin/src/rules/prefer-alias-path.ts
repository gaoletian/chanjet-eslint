import { TSESTree } from '@typescript-eslint/types';
import { isRequireContextExpression, isRequireExpression, useReplaceNode } from '../astUtil';
import {
  getAliasOrRelativeRegex,
  // getModuleDirPath,
  getModuleFullPath,
  removeIndexAndExt,
  toSrcAliasPath,
  addDomainExposes,
} from '@chanjet/eslint-utils';

const fixedCache = new Set<string>();

export default <Chanjet.ChanjetRuleModule<{ target?: RegExp; from?: RegExp; aliasName?: string }>>{
  create(context) {
    const currentFile = context.getFilename();
    const message = '跨目录引用优先使用别名路径';
    const options = context.options[0];

    const sourceCode = context.getSourceCode();
    const srcDirFullPath = currentFile.split('/src/')[0] + '/src';

    const replaceNode = useReplaceNode(context, message);

    const toAliasPath = (node: TSESTree.Node /* , isRequireExpression = false */) => {
      // 如果当前文件是否符合选项 target正则
      if (options?.target?.test(currentFile) === false) return;
      const nodeText = sourceCode.getText(node);

      if (fixedCache.has(nodeText)) return;

      const moduleFullPath = getModuleFullPath(nodeText, currentFile);
      // const moduleDirPath = getModuleDirPath(moduleFullPath);

      // 三方模块 例如 react
      if (moduleFullPath === '') return;

      // 导入的模块路径是否符合选项 from 正则
      if (options?.from?.test(moduleFullPath) === false) return;

      // prettier-ignore
      // let newModulePath = moduleDirPath !== fileModuleDir
      //     ? toSrcAliasPath(moduleFullPath, srcDirFullPath) // 跨目录转换为src别名路径
      //     : toRelativePath(currentFile, moduleFullPath); // 相同模块目录使用相对路径

      let newModulePath = toSrcAliasPath(moduleFullPath, srcDirFullPath)

      const RawModulePathRegexp = getAliasOrRelativeRegex();
      // 允许自定义别名
      newModulePath = options?.aliasName
        ? removeIndexAndExt(newModulePath).replace('src/', options.aliasName + '/')
        : removeIndexAndExt(newModulePath);

      // 收集expose代码 for 模块联邦
      addDomainExposes(newModulePath, moduleFullPath, currentFile);

      const nodeTextFixed = nodeText.replace(RawModulePathRegexp, (RawModulePath) => {
        // RawModulePath[0] = ['"`]
        // RawModulePath.slice(-1) = ['"`$]
        return RawModulePath[0] + newModulePath + RawModulePath.slice(-1);
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
      ExportNamedDeclaration(node) {
        toAliasPath(node);
      },
      ExportAllDeclaration(node) {
        toAliasPath(node);
      },
    };
  },
};
