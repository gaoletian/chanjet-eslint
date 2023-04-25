import type { TSESTree } from '@typescript-eslint/types';
import type { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint/Rule';
/**
 * 从当前节点依次向上获取 node.type
 * @param node
 * @param nodePath
 * @returns {string[]}
 */
export function getCodePath(node: TSESTree.Node, nodePath: string[] = []): string[] {
  nodePath.push(node.type);
  return node.parent ? getCodePath(node.parent, nodePath) : nodePath;
}

/**
 * 删除AST节点
 * @param context
 * @param node
 */
export const removeNode = (context: RuleContext<string, unknown[]>, node: TSESTree.Node) => {
  context.report({
    node,
    // @ts-ignore
    message: 'remove node',
    fix(fixer) {
      return fixer.remove(node);
    },
  });
};

/**
 * 重命名引用符号
 * @param context
 * @param ref
 * @param newSymbolName
 */
export const renameReferance = (
  context: RuleContext<string, unknown[]>,
  ref: TSESTree.Identifier | TSESTree.JSXIdentifier,
  newSymbolName: string
) => {
  context.report({
    node: ref,
    // @ts-ignore
    message: '重命名引用符号',
    data: {
      node: ref.name,
    },
    fix(fixer) {
      return fixer.replaceTextRange(ref.range, newSymbolName);
    },
  });
};

/**
 * 返回一个 替换 node 节点的函数
 * @param context
 * @param message
 * @returns {(node: TSESTree.Node, nodeSource: string) => void}
 */
export const useReplaceNode =
  (context: RuleContext<string, unknown[]>, message: string) => (node: TSESTree.Node, nodeSource: string) => {
    context.report({
      node,
      // @ts-ignore
      message,
      fix(fixer) {
        return fixer.replaceText(node, nodeSource);
      },
    });
  };

/**
 * 是否 import type
 */
export const isImportType = (node: TSESTree.ImportDeclaration) => node.importKind === 'type';

/**
 * 是否 require.context 表达式
 * @example
 * require.context('/src/static/' + name + '.png')
 */
export const isRequireContextExpression = (node: TSESTree.CallExpression) => {
  return (
    node &&
    node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'require' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'context'
  );
};

/**
 * 是否require表达式
 * @example
 * require('src/static/logo.png')
 */
export const isRequireExpression = (node: TSESTree.CallExpression) => {
  return node?.callee?.type === 'Identifier' && node.callee.name === 'require';
};
/**
 * 是否静态require表达式
 * @example
 * require('src/static/logo.png')
 */
export const isStaticRequire = (node: TSESTree.CallExpression) => {
  return (
    node?.callee?.type === 'Identifier' &&
    node?.callee?.name === 'require' &&
    node.arguments.length === 1 &&
    ((node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string') ||
      (node.arguments[0].type === 'TemplateLiteral' && node.arguments[0].quasis.length === 1))
  );
};

/**
 * 是否动态require表达式
 * @example
 * require(`src/static/${pic}.png`)
 * require('src/static/' + pic + '.png')
 */
export const isDymanicRequire = (node: TSESTree.CallExpression) => {
  return (
    node &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    ((node.arguments[0].type === 'TemplateLiteral' && node.arguments[0].expressions.length > 0) ||
      node.arguments[0].type === 'BinaryExpression')
  );
};
