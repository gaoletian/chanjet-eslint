'use strict';

import type { AST } from '@typescript-eslint/experimental-utils/dist/ts-eslint';
import type { TSESTree } from '@typescript-eslint/types';
import type { Rule } from 'eslint';
import type EsTree from 'estree';

import fs from 'fs-extra';
import path from 'path';
import { getCodePath } from '../astUtil';

const WorkDir = process.cwd();
const isRelativePath = (mpath: string) => /^\./m.test(mpath);

const getFirstNode = (node: EsTree.Program) => node.body[0] as EsTree.Node;

function getImportSpecifier(node: EsTree.Identifier) {
  // @ts-ignore
  return node.parent as EsTree.ImportDefaultSpecifier | EsTree.ImportNamespaceSpecifier | EsTree.ImportSpecifier;
}

let shouldInsertAppContextImport = false;

const DepCache = new Set();
const addExportCode = async (exportCode: string, namespace: string) => {
  if (DepCache.has(exportCode)) return;
  DepCache.add(exportCode);
  await fs.appendFile(path.resolve(WorkDir, `src/AppContext/${namespace}.ts`), exportCode + '\n');
};
/**
 * Api目录重构Rule
 *
 * 禁止 直接引用 api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter 目录的模块
 * 禁止 组件(src/components)引用业务模块(src/modules)下的文件
 * 禁止 api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter 直接引用业务模块(src/modules)下的文件
 *
 */
export default <Rule.RuleModule>{
  meta: {
    fixable: 'code',
    messages: {
      msgAppContext: '自动添加HttpContext导入',
      msgRenameSymbolName: '重命名变量引用符号',
      msgRemoveImport: '自动删除对上层模块的导入语句',
    },
  },
  create(context) {
    return {
      Program() {
        shouldInsertAppContextImport = false;
      },
      'Program:exit'(node: EsTree.Program) {
        if (
          shouldInsertAppContextImport === true &&
          !context.getSourceCode().getText().includes('import * as AppContext from')
        ) {
          const FirstNode = getFirstNode(node as EsTree.Program);
          context.report({
            node,
            message: '添加AppContext导入语句',
            fix(fixer) {
              return fixer.insertTextBefore(FirstNode, "import * as AppContext from 'src/AppContext';\n");
            },
          });
        }
        // console.log('ok', context.getFilename());
      },
      ImportDeclaration(node) {
        const sourcefileDir = path.dirname(context.getFilename());
        let modulePath = node.source.value as string;

        // 1. 只处理以 ./ 或 ../ 或 src/ 开头的模块引用
        if (/^(\.+|src)\//m.test(modulePath)) {
          // 删除 .js .jsx .tsx .ts  或 /index
          modulePath = modulePath.replace(/(.+)\.[jt]sx?$/m, '$1').replace(/(.+)\/index$/, '$1');

          // 2. 路径转换 将相对路径或src别名路径转换为绝对路径
          const moduleRealPath = isRelativePath(modulePath)
            ? path.resolve(sourcefileDir, modulePath)
            : path.resolve(WorkDir, modulePath);
          const srcAliasPath = moduleRealPath.replace(WorkDir + '/', '');
          // 3. 规则较验
          // let validRegex = /\/src\/(api|routers|utils|config|service|theme|stores|metadata|models|AppPresenter|data-sources|behavior)(?!\w)/m;
          const validRegex = /\/src\/(api)(?!\w)/m;
          const matcher = moduleRealPath.match(validRegex);
          // api routers utils config ...
          let namespace = matcher ? matcher[1] : '';
          namespace = namespace.replace('-', '_');

          if (matcher) {
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
                context.report({
                  node: ref.identifier,
                  message: '重命名引用符号',
                  data: {
                    node: ref.identifier.name,
                  },
                  fix(fixer) {
                    return fixer.replaceTextRange(
                      ref.identifier.range as AST.Range,
                      ['AppContext', namespace, newSymbolName].join('.')
                    );
                  },
                });
              });

              // 删除未引用的导入
              if (varNode.references.length === 0) {
                context.report({
                  node: node,
                  message: '删除未引用的导入',
                  fix(fixer) {
                    return fixer.remove(node);
                  },
                });
              }
            });
          }
        }
      },
      Identifier(node) {
        if (node.name === 'AppContext') {
          const codePath = getCodePath(node as TSESTree.Node).join('.');
          if (
            codePath.startsWith('Identifier.MemberExpression') &&
            /(FunctionExpression|ArrowFunctionExpression|ClassDeclaration|FunctionDeclaration)/g.test(codePath) ===
              false
          ) {
            context.report({
              node,
              message: '禁止在函数外直接调用AppContext',
              data: {
                node: node.name,
              },
            });
          }
        }
      },
    };
  },
};
