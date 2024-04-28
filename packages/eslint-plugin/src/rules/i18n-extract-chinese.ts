export default <Chanjet.ChanjetRuleModule<{ target?: RegExp; from?: RegExp; aliasName?: string }>>{
  create(context) {
    const reportRange = (node: any, replacedText: any, start: number, end: number) => {
      context.report({
        node,
        //@ts-ignore
        message: `完成用i18n.cjtT()函数替换中文文本: ${node?.value}`,
        fix(fixer) {
          return fixer.replaceTextRange([start, end], `${replacedText}`);
        },
      });
    };
    const regex = /[\u4e00-\u9fa5\u3000-\u303F\uff01-\uff5e。]+/g;
    const matchNode = (node: any, treeNode: any) => {
      if (node.type === 'JSXText' && regex.test(node.raw)) {
        const textValue = node.raw;
        if (!textValue.includes('i18n') && !textValue.includes('cjtT')) {
          const replacedText = textValue.replace(regex, (match: any) => {
            return `{i18n.cjtT('${match.trim()}')}`;
          });
          const start = node.range[0];
          const end = node.range[1];
          reportRange(treeNode, replacedText, start, end);
        }
      }

      //Literal类型
      if (node.type === 'Literal' && regex.test(node.value) && (node?.parent?.right || node?.parent?.consequent)) {
        const textValue = node.value;
        if (!textValue.includes('i18n') && !textValue.includes('cjtT')) {
          const replacedText = textValue.replace(regex, (match: any) => {
            return `i18n.cjtT('${match.trim()}')`;
          });
          const start = node.range[0];
          const end = node.range[1];
          reportRange(treeNode, replacedText, start, end);
        }
      }

      //变量声明类型 Identifier
      if (
        node.type === 'Identifier' &&
        node?.parent.type != 'MemberExpression' &&
        node?.parent.type != 'ConditionalExpression' &&
        !node?.parent?.operator &&
        !node?.parent?.parent?.operator &&
        !node?.parent?.parent?.parent?.operator
        // &&
        // (node?.parent?.left &&
        // node?.parent?.operator == '||')
      ) {
        const textValue = node.name;

        if (!textValue.includes('i18n') && !textValue.includes('cjtT')) {
          const i18nText = `i18n.cjtT(${node.name})`;
          const start = node.range[0];
          const end = node.range[1];
          reportRange(treeNode, i18nText, start, end);
        }
      }
    };

    const traverseAndReplace = (tree: any) => {
      if (tree.type === 'JSXElement') {
        for (let i = 0; i < tree.children.length; i++) {
          const node = tree.children[i];

          function traverseObject(node: any) {
            for (const key in node) {
              if (typeof node[key] === 'object' && node[key].type && key !== 'parent' && key !== 'children') {
                traverseObject(node[key]); // 递归调用
              } else if (node.type) {
                matchNode(node, tree.children[i]);
              }
            }
          }

          traverseObject(node);
        }
      }
    };
    return {
      JSXElement(node) {
        traverseAndReplace(node); // 替换中文翻译函数
      },
    };
  },
};
