import { addExposeChanjet } from '@chanjet/eslint-utils';
import { isImportType } from '../astUtil';

export default <Chanjet.ChanjetRuleModule<{ target?: RegExp; from?: RegExp; aliasName?: string }>>{
  create() {
    return {
      /* ---------------------------- 静态导入 Import From ---------------------------- */

      ImportDeclaration(node) {
        const modulePath = node.source.value as string;
        if (modulePath.startsWith('@chanjet') && isImportType(node) === false) {
          addExposeChanjet(modulePath);
        }
      },
    };
  },
};
