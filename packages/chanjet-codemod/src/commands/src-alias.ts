import { relative, dirname, resolve } from 'path';
import { readFile, writeFile } from 'fs-extra';
import { threadId } from 'worker_threads';

function toSrcAliasPath(rawModulePath: string, srcDirFullPath: string) {
  return rawModulePath.replace(srcDirFullPath, 'src');
}
function toRelativePath(filePath: string, moduleFullPath: string) {
  const relativePath = relative(dirname(filePath), moduleFullPath);
  return relativePath.startsWith('..') ? relativePath : './' + relativePath;
}
function srcToRelativePath(filePath: string, srcAliasPath: string, srcDirFullPath: string) {
  const moduleFullPath = srcAliasPath.replace(/src\//, srcDirFullPath + '/');
  const relativePath = relative(dirname(filePath), moduleFullPath);
  return relativePath.startsWith('..') ? relativePath : './' + relativePath;
}

/**
 * 返回目录绝对路径
 * 1. /root/src/modules/foo
 * 2. /root/src/(components|api|router|theme|util|........)
 * @param {string} fullpath
 */
const getModuleDirPath = (fullpath: string) => {
  const match = fullpath.match(/(.+?\/src)\/([a-zA-Z0-9\-_]+)\/?([a-zA-Z0-9\-_]+)?/);
  if (!match) {
    console.log('[getModuleDirPath] fail ', fullpath);
    return null;
  }
  const [, p1, p2, p3] = match;
  return p2 === 'modules' ? [p1, p2, p3].join('/') : [p1, p2].join('/');
};

/**
 * 相对路径转换为src别名路径
 * @param {string} filePath
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function transform(filePath: string) {
  const matcher = filePath.match(/.+?\/src/);
  if (matcher === null) return;

  const srcDirFullPath = matcher[0];
  let fContent = await readFile(filePath, { encoding: 'utf8' });
  const fileModuleDir = getModuleDirPath(filePath);

  // 1. convert src alias path to relative path
  fContent = fContent.replace(
    /(?<!\/\/.+?)(['"`])(src\/.+?)(['"$`])/gm,
    (_: string, p1: string, rawModulePath: string, p3: string) => {
      let newModulePath = srcToRelativePath(filePath, rawModulePath, srcDirFullPath);
      // 补齐最后的 /
      if (rawModulePath.slice(-1) === '/' && newModulePath.slice(-1) !== '/') {
        newModulePath += '/';
      }

      // debug([rawModulePath, newModulePath].join(' ==> '))

      return p1 + newModulePath + p3;
    }
  );
  // 2. handle relative path all to src alias path or relative path
  const newContent = fContent.replace(
    /(?<!\/\/.+?)(['"`])(\.+\/.+?)(['"$`])/gm,
    (_: string, p1: string, rawModulePath: string, p3: string) => {
      try {
        let moduleFullPath = resolve(dirname(filePath), rawModulePath);

        // remove last '/index' or '.ts','.tsx','.js','.jsx'
        moduleFullPath = moduleFullPath.replace(/(.+)\.[jt]sx?$/, '$1').replace(/(.+)\/index$/, '$1');

        /* ========================================================================== */
        /* 移动文件 GLOBALUSERSTATE.TS, TABPAGESTATE.TS, APPSTATES.TS TO STORES           */
        /* ========================================================================== */

        // move globalUserState.ts and tabPageState.ts to stores/
        moduleFullPath = moduleFullPath.replace(
          /src\/modules\/app-structure\/(globalUserState|tabPageState)/,
          'src/stores/$1'
        );
        // move AppStates.ts to stores/
        moduleFullPath = moduleFullPath.replace(/src\/modules\/AppStates/, 'src/stores/AppStates');

        let newModulePath = rawModulePath;
        const moduleDirPath = getModuleDirPath(moduleFullPath);
        // 非src目录 例如 '../../../node_modules/@chanjet'
        if (moduleDirPath === null) return p1 + rawModulePath + p3;

        // 不同模块目录转换为src别名路径，相同模块目录使用相对路径
        if (moduleDirPath !== fileModuleDir /* && !moduleDirPath.includes(`/src/static`) */) {
          newModulePath = toSrcAliasPath(moduleFullPath, srcDirFullPath);
        } else {
          newModulePath = toRelativePath(filePath, moduleFullPath);
        }

        // 补齐最后的 /
        if (p3 === '$' && rawModulePath.slice(-1) === '/' && newModulePath.slice(-1) !== '/') {
          newModulePath += '/';
          // debug([rawModulePath, newModulePath].join(' ==> '));
        }

        // debug(process.env.JEST_WORKER_ID, " ", rawModulePath, '==>', newModulePath);

        return p1 + newModulePath + p3;
      } catch (err) {
        console.log(err);
        return p1 + rawModulePath + p3;
      }
    }
  );

  const workerId = threadId || process.pid;
  await writeFile(filePath, newContent, { encoding: 'utf8' });

  console.log(filePath);
  return workerId;
}
