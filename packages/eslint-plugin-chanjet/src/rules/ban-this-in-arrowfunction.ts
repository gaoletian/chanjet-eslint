import type { TSESTree } from '@typescript-eslint/types';
import type { Rule } from 'eslint';
import { getCodePath } from '../astUtil';

/**
 * 禁止 在箭头函数中使用this的情况，排除class内部的箭头函数
 *
 * console.log(this.name)  // this is invalid
 *
 * const FunctionComponent = () => {
 *      return (<div onClick={this.handleClick}></div>)  // this  here is invalid
 * }
 *
 * class ClassComponent extends React.Component<any,any>{
 *      classProperty = () => console.log(this.name)   // this is valid
 *      methodDefinition() {
 *          let foo = () => this.foo   // this is valid
 *      }
 * }
 */
export default <Rule.RuleModule>{
  create(context) {
    return {
      ThisExpression(node) {
        const nodePath = getCodePath(node as TSESTree.Node)
          .filter((t) =>
            [
              'ThisExpression',
              'ClassProperty',
              'MethodDefinition',
              'FunctionExpression',
              'FunctionDeclaration',
              'ObjectExpression',
              'ClassDeclaration',
              'ArrowFunctionExpression',
              'Program',
            ].includes(t)
          )
          .join('.');

        if (/ThisExpression\.(ArrowFunctionExpression\.)+Program/.test(nodePath)) {
          context.report({
            node,
            message: '箭头函数中的 this is undefined',
          });
        }
      },
    };
  },
};
