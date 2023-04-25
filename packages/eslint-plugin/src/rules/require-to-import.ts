import type { TSESTree } from '@typescript-eslint/types';
import { isDymanicRequire, isStaticRequire } from '../astUtil';
import { camelCase } from 'lodash';
import path from 'path';

export default <Chanjet.ChanjetRuleModule<{ target: RegExp; from: RegExp }>>{
  create(context) {
    // 初始化工作目录
    // const currentFile = context.getFilename();
    // WorkDir = currentFile.split('/src/')[0];
    const sourceCode = context.getSourceCode();
    const requireToImport = new Set();

    const fixRequireLodash = (node: TSESTree.VariableDeclaration) => {
      const Variables = context.getDeclaredVariables(node);
      if (Variables[0]?.name !== '_') return;
      // @ts-ignore
      if (Variables[0]?.references[0]?.identifier?.parent?.init?.type !== 'ObjectExpression') return;
      context.report({
        node,
        // @ts-ignore
        message: 'convert require lodash to import ',
        fix(fixer) {
          return fixer.replaceText(node, `import * as _ from 'lodash'`);
        },
      });
    };

    const staticRequireToStaticImport = (node: TSESTree.CallExpression) => {
      if (
        node?.parent?.type === 'VariableDeclarator' &&
        node.parent?.id?.type === 'Identifier' &&
        node.parent?.parent?.type === 'VariableDeclaration' &&
        node.parent?.parent?.parent?.type === 'Program'
      ) {
        const name = node.parent.id.name;
        const spec =
          node.arguments[0].type === 'TemplateLiteral'
            ? node.arguments[0].quasis[0].value.raw
            : // @ts-ignore
            node.arguments[0].value;

        const _node = node.parent.parent as TSESTree.VariableDeclaration;

        context.report({
          node: _node,
          // @ts-ignore
          message: 'convert require lodash to import ',
          fix(fixer) {
            return fixer.replaceText(_node, `import ${name} from '${spec}';`);
          },
        });
        return;
      }

      if (
        node.parent?.type === 'ArrowFunctionExpression' &&
        node.parent?.parent?.type === 'CallExpression' &&
        node.parent?.parent.callee.type === 'Identifier' &&
        node.parent?.parent.callee.name === 'asyncComponent'
      ) {
        const spec =
          node.arguments[0].type === 'TemplateLiteral'
            ? node.arguments[0].quasis[0].value.raw
            : // @ts-ignore
            node.arguments[0].value;
        context.report({
          node,
          // @ts-ignore
          message: 'convert require lodash to import ',
          fix(fixer) {
            return fixer.replaceText(node, `import('${spec}')`);
          },
        });
        return;
      }

      if (
        node.parent?.type === 'AssignmentExpression' ||
        node.parent?.type === 'ReturnStatement' ||
        node.parent?.type === 'Property' ||
        // node.parent?.type === 'ClassProperty' ||
        node.parent?.type === 'TemplateLiteral' ||
        node.parent?.type === 'ArrayExpression' ||
        node.parent?.type === 'JSXExpressionContainer' ||
        node.parent?.type === 'VariableDeclarator' ||
        node.parent?.type === 'LogicalExpression' ||
        node.parent?.type === 'ConditionalExpression'
      ) {
        sourceCode.getFirstToken;
        const spec =
          node.arguments[0].type === 'TemplateLiteral'
            ? node.arguments[0].quasis[0].value.raw
            : // @ts-ignore
            node.arguments[0].value;
        const requireVarName = camelCase(`require_${path.basename(spec)}`);

        requireToImport.add(`import ${requireVarName} from '${spec}';`);

        context.report({
          node,
          // @ts-ignore
          message: 'convert require lodash to import ',
          fix(fixer) {
            return fixer.replaceText(node, requireVarName);
          },
        });
        return;
      }
    };

    const dymanicRequireToImportGlobEager = (node: TSESTree.CallExpression) => {
      if (node.arguments[0].type === 'TemplateLiteral') {
        const globPattern = node.arguments[0].quasis.map((el) => el.value.cooked).join('*');

        const requireVarName = camelCase(globPattern);

        requireToImport.add(`const ${requireVarName} = import.meta.globEager('${globPattern}');`);

        context.report({
          node,
          // @ts-ignore
          message: 'convert require lodash to import ',
          fix(fixer) {
            return fixer.replaceText(node, `${requireVarName}[${sourceCode.getText(node.arguments[0])}]`);
          },
        });
        return;
      }

      // if (node.arguments[0].type === 'BinaryExpression') {
      // }
      return;
    };

    return {
      /* ========================================================================== */
      /* IMPORT                                                                     */
      /* ========================================================================== */

      VariableDeclaration(node): void {
        // 只处理 import type
        fixRequireLodash(node);
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
          staticRequireToStaticImport(node);
        }
        if (isDymanicRequire(node)) {
          dymanicRequireToImportGlobEager(node);
        }
      },
      'Program:exit'() {
        if (requireToImport.size > 0) {
          const requireToImportCode = Array.from(requireToImport).join('\n') + '\n';
          const node = sourceCode.ast.body[0];
          context.report({
            node,
            // @ts-ignore
            message: 'convert require lodash to import ',
            fix(fixer) {
              return fixer.insertTextBefore(node, requireToImportCode);
            },
          });
        }
      },
    };
  },
};
