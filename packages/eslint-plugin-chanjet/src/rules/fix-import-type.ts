import type { RuleListener, RuleContext } from '@typescript-eslint/experimental-utils/dist/ts-eslint';
import type { TSESTree } from '@typescript-eslint/types';
import { appendFile, readFile, ensureFile } from 'fs-extra';
import { startCase } from 'lodash';
import * as path from 'path';
import * as astUtil from '../astUtil';

let WorkDir: string;

// 导出缓存
const DepCache = new Set();

const addExportCode = async (exportCode: string, namespace: string) => {
  if (DepCache.has(exportCode)) return;
  DepCache.add(exportCode);
  const file = path.resolve(WorkDir, `src/types/${namespace}.d.ts`);
  await ensureFile(file);
  const fcontent = (await readFile(file)).toString('utf-8');
  if (fcontent.includes(exportCode)) return;
  await appendFile(file, exportCode + '\n');
};

function shouldRefactor(modulePath: string) {
  return modulePath.startsWith('src/');
}

function getNameSpace(modulePath: string) {
  const rawDirName = modulePath.split('/src/')[1];
  // web-theme ==> WebTheme, dataSource ===> DataSource
  return startCase(rawDirName.split('/')[0]).replace(/\s/g, '').split('.')[0];
}

type ChanjetRuleModule = {
  create(context: RuleContext<string, unknown[]>): RuleListener;
};

export default <ChanjetRuleModule>{
  create(context) {
    // 初始化工作目录
    const filePath = context.getFilename();
    WorkDir = filePath.split('/src/')[0];
    const namespace = getNameSpace(filePath) + 'External';

    return {
      /* ========================================================================== */
      /* EXIT                                                                    */
      /* ========================================================================== */

      'Program:exit'() {
        let exportNamespaceCode = '// this file is auto generate \n';
        exportNamespaceCode += `export as namespace ${namespace};`;
        if (!DepCache.has(exportNamespaceCode)) {
          addExportCode(exportNamespaceCode, namespace);
        }
      },

      /* ========================================================================== */
      /* IMPORT                                                                     */
      /* ========================================================================== */

      ImportDeclaration(node): void {
        // 只处理 import type
        if (astUtil.isImportType(node) && shouldRefactor(node.source.value as string)) {
          // log
          console.log(process.env.JEST_WORKER_ID || process.ppid, filePath);

          /* ---------------------------------- 抽取类型 ---------------------------------- */
          // prettier-ignore
          const specifiers = ( node.specifiers as TSESTree.ImportSpecifier[] )
                        .map((spec) => {
                            // import type IFoo from '...'
                            if (!spec.imported)
                                return 'default as ' + spec.local.name;
                            // import type {IFoo} from '...'
                            if (spec.local.name === spec.imported.name)
                                return spec.imported.name;
                            // import type {foo as IFoo, default as IFooDefault} from '...'
                            return (
                                spec.imported.name + ' as ' + spec.local.name
                            );
                        })
                        .join(',');

          addExportCode(`export type {${specifiers}} from ${node.source.raw}`, namespace);

          /* -------------------------  重命名类型引用，添加namespace ------------------------- */

          const Variables = context.getDeclaredVariables(node);
          Variables.forEach((varNode) => {
            varNode.references.forEach((ref) => {
              const newSymbolName = [namespace, ref.identifier.name].join('.');
              astUtil.renameReferance(context, ref.identifier, newSymbolName);
            });
          });

          /* ----------------------------- 删除 Import Type ----------------------------- */

          astUtil.removeNode(context, node);
        }
      },
    };
  },
};
