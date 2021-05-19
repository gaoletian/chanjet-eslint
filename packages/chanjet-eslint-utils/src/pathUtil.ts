import path from 'path';

export function toSrcAliasPath(rawModulePath: string, srcDirFullPath: string) {
  return rawModulePath.replace(srcDirFullPath, 'src');
}
export function toRelativePath(filePath: string, moduleFullPath: string) {
  const relativePath = path.relative(path.dirname(filePath), moduleFullPath);
  return relativePath.startsWith('..') ? relativePath : './' + relativePath;
}
export function srcToRelativePath(filePath: string, srcAliasPath: string, srcDirFullPath: string) {
  const moduleFullPath = srcAliasPath.replace(/src\//, srcDirFullPath + '/');
  const relativePath = path.relative(path.dirname(filePath), moduleFullPath);
  return relativePath.startsWith('..') ? relativePath : './' + relativePath;
}

/**
 * 返回目录绝对路径
 * 1. /root/src/modules/foo
 * 2. /root/src/(components|api|router|theme|util|........)
 * @param {string} fullpath
 */
export function getModuleDirPath(fullpath: string) {
  const match = fullpath.match(/(.+?\/src)\/([a-zA-Z0-9\-_]+)\/?([a-zA-Z0-9\-_]+)?/);
  if (!match) {
    console.log('[getModuleDirPath] fail ', fullpath);
    return null;
  }
  const [, p1, p2, p3] = match;
  return p2 === 'modules' ? [p1, p2, p3].join('/') : [p1, p2].join('/');
}

/**
 * 获取相对路径或src别名路径正则表达式
 * @returns {RegExp}
 * @description
 *
 * 通过正则 /['"`]((\.+|src)\/.+?)['"$`]/m 匹配模块路径，包括如下情况：
 *  require(`../foo/index$`)  ==>   [`../foo/index$, ../foo/index]
 *  require(`src/foo/index$`)  ==>   [`src/foo/index$, src/foo/index]
 *  require('src/static/' + name + '.png')  ==>   ['src/static/', src/static/]
 */
export const getAliasOrRelativeRegex = () => /['"`]((\.+|src)\/.+?)['"$`]/m;

/**
 * 获取导入模块的绝对路径
 * @param nodeCode  # import , import(), require(), require.context()
 * @param currentFile # 当前文件路径
 * @returns {string}
 *
 */
export function getModuleFullPath(nodeCode: string, currentFile: string) {
  const matcher = nodeCode.match(getAliasOrRelativeRegex());
  if (matcher === null) {
    return '';
  }
  const modulePath = matcher[1];

  // ../foo ==> /root/src/foo
  if (modulePath.startsWith('.')) {
    const latstSlash = modulePath.slice(-1) === '/' ? '/' : '';
    return path.resolve(path.dirname(currentFile), modulePath) + latstSlash;
  }
  // src/foo  ==> /root/src/foo
  return path.join(currentFile.split('/src/')[0], modulePath);
}

export function removeIndexAndExt(str: string) {
  return str.replace(/\.([jt]sx?|mjs)/g, '').replace('/index', '');
}
