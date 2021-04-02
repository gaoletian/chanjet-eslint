'use strict';
const getCurrentNodePath = (node, nodePath) => {
  nodePath.push(node.type);
  if (node.parent) {
    getCurrentNodePath(node.parent, nodePath);
  }
};
exports.getCurrentNodePath = getCurrentNodePath;
