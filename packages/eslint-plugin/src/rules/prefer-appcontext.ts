'use strict';

// import type { TSESTree } from '@typescript-eslint/types';
import type EsTree from 'estree';

import fs from 'fs-extra';
import path from 'path';
// import { getCodePath } from '../astUtil';
import { getModuleFullPath, getRawModulePath } from '@chanjet/eslint-utils';
import { removeNode, renameReferance } from '../astUtil';
import { TSESTree } from '@typescript-eslint/types';

let WorkDir = process.cwd();
// const isRelativePath = (mpath: string) => /^\./m.test(mpath);

const getFirstNode = (node: TSESTree.Program) => node.body[0] as TSESTree.Node;

function getImportSpecifier(node: EsTree.Identifier) {
  // @ts-ignore
  return node.parent as EsTree.ImportDefaultSpecifier | EsTree.ImportNamespaceSpecifier | EsTree.ImportSpecifier;
}

let shouldInsertAppContextImport = false;

const fixedCache = new Set<string>();
// const DepCache = new Set();
const exportCodeCache = new Map<string, string>();

const addExportCode = async (exportCode: string, namespace: string) => {
  const fpath = path.resolve(WorkDir, `src/AppContext/${namespace}.ts`);
  // 读取文件缓存
  if (!exportCodeCache.has(fpath)) {
    await fs.ensureFile(fpath);
    const fcontent = await fs.readFile(fpath, 'utf-8');
    exportCodeCache.set(fpath, fcontent);
  }

  // if (DepCache.has(exportCode)) return;
  // DepCache.add(exportCode);

  const fileContet = exportCodeCache.get(fpath);
  if (fileContet?.includes(exportCode) === false) {
    exportCodeCache.set(fpath, fileContet + exportCode + '\n');
    await fs.appendFile(fpath, exportCode + '\n');
  }
};
/**
 * Api目录重构Rule
 *
 * 禁止 直接引用 api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter 目录的模块
 * 禁止 组件(src/components)引用业务模块(src/modules)下的文件
 * 禁止 api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter 直接引用业务模块(src/modules)下的文件
 *
 */
export default <Chanjet.ChanjetRuleModule<{ target: RegExp; from: RegExp }>>{
  meta: {
    fixable: 'code',
    messages: {
      msgAppContext: '自动添加HttpContext导入',
      msgRenameSymbolName: '重命名变量引用符号',
      msgRemoveImport: '自动删除对上层模块的导入语句',
    },
  },
  create(context) {
    const currentFile = context.getFilename();
    const sourceCode = context.getSourceCode();

    function useAppContext(node: TSESTree.Node) {
      const nodeText = sourceCode.getText(node);

      if (fixedCache.has(nodeText)) return;

      const modulePath = getRawModulePath(nodeText);

      // 1. 只处理以 ./ 或 ../ 或 src/ 开头的模块引用
      if (/^(\.+|src)\//m.test(modulePath) == false) return;

      // 2. 路径转换 将相对路径或src别名路径转换为绝对路径
      const moduleRealPath = getModuleFullPath(nodeText, currentFile);
      const srcAliasPath = 'src/' + moduleRealPath.split('src/')[1];

      WorkDir = moduleRealPath.split('/src/')[0];

      // 3. 规则较验
      // const validRegex = /\/src\/(api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter|data-sources|behavior)(?!\w)/m;
      const validRegex = /\/src\/(api|routers2|utils|service|metadata|models)(?!\w)/m;
      const matcher = moduleRealPath.match(validRegex);

      if (!matcher) return;

      // api routers utils config ...
      let namespace = matcher ? matcher[1] : '';
      namespace = namespace.replace('-', '_');

      // AppContext
      shouldInsertAppContextImport = true;

      const Variables = context.getDeclaredVariables(node);

      Variables.forEach((varNode) => {
        let newSymbolName = '';

        const importSpecifier = getImportSpecifier(varNode.identifiers[0]);

        switch (importSpecifier.type) {
          case 'ImportNamespaceSpecifier': {
            // import * as AppContext from 'src/AppContext'
            newSymbolName = path.basename(modulePath).replace('-', '_');
            addExportCode(`export * as ${newSymbolName} from '${srcAliasPath}'`, namespace);
            break;
          }
          case 'ImportDefaultSpecifier': {
            // import AppContext from 'src/AppContext';
            newSymbolName = path.basename(modulePath).replace('-', '_');
            addExportCode(`export { default as ${newSymbolName} } from '${srcAliasPath}'`, namespace);
            break;
          }
          case 'ImportSpecifier':
            // 1. import {api as Hapi, api2 as Hapi2} from 'src/api'
            // 2. import {api, api2} from 'src/api'
            // 3. import {default as api} from 'src/api'
            if (importSpecifier.imported.name === 'default') {
              newSymbolName = path.basename(modulePath).replace('-', '_');
              addExportCode(`export { default as ${newSymbolName} } from '${srcAliasPath}'`, namespace);
            } else {
              newSymbolName = importSpecifier.imported.name;
              addExportCode(`export * from '${srcAliasPath}'`, namespace);
            }
            break;
          default:
            addExportCode(`export * from '${srcAliasPath}'`, namespace);
        }

        // 重命名引用符号  userStore ==> AppContext.stores.userStore
        varNode.references.forEach((ref) => {
          const newName = ['AppContext', namespace, newSymbolName].join('.');
          // @ts-ignore
          renameReferance(context, ref.identifier, newName);
        });

        // 删除未引用的导入
        if (varNode.references.length === 0) {
          removeNode(context, node);
        }
      });

      // fixedCache.add(nodeTextFixed);
    }

    return {
      Program() {
        shouldInsertAppContextImport = false;
      },
      'Program:exit'(node) {
        if (
          shouldInsertAppContextImport === true &&
          !context.getSourceCode().getText().includes('import * as AppContext from')
        ) {
          const FirstNode = getFirstNode(node);
          context.report({
            node,
            // @ts-ignore
            message: '添加AppContext导入语句',
            fix(fixer) {
              return fixer.insertTextBefore(FirstNode, "import * as AppContext from 'src/AppContext';\n");
            },
          });
        }
        // console.log('ok', context.getFilename());
      },

      /* ---------------------------- 静态导入 Import From ---------------------------- */

      ImportDeclaration(node) {
        useAppContext(node);
      },

      // Identifier(node) {
      //   if (node.name === 'AppContext') {
      //     const codePath = getCodePath(node as TSESTree.Node).join('.');
      //     if (
      //       codePath.startsWith('Identifier.MemberExpression') &&
      //       /(FunctionExpression|ArrowFunctionExpression|ClassDeclaration|FunctionDeclaration)/g.test(codePath) ===
      //         false
      //     ) {
      //       context.report({
      //         node,
      //         message: '禁止在函数外直接调用AppContext',
      //         data: {
      //           node: node.name,
      //         },
      //       });
      //     }
      //   }
      // },
    };
  },
};
