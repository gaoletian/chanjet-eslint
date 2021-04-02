'use strict';

const { getCurrentNodePath } = require("../astUtil");

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
module.exports = {
  create(context) {
    return {
      ThisExpression(node) {
        let nodePath = [];
        getCurrentNodePath(node, nodePath);
        nodePath = nodePath
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

        if (/ThisExpression\.(ArrowFunctionExpression\.)*Program/.test(nodePath)) {
          context.report({
            node,
            message: 'this object is undefined',
            data: {
              identifier: node.name,
            },
          });
        }
      },
    };
  },
};
