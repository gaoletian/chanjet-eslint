import { createESlint } from './testUtil';
/**
 * 禁止 src/api/foo.ts 导入 src/modules 目录下的任何模块
 */
test('chanjet/ban-import-from-modules should work', async () => {
  // 规则支持选项配置
  const linter = createESlint({
    'chanjet/ban-import-from-modules': ['error', { target: /src\/(api|utils)/, from: /src\/modules\// }],
  });
  let raw = [
    `import foo from '../modules/foo';`,
    `import('../modules/foo');`,
    `require('../modules/foo');`,
    `require.context('../modules/foo');`,
  ];

  let result = await linter.lintText(raw.join('\n'), { filePath: '/root/src/api/foo.ts' });

  expect(result[0].errorCount).toBe(raw.length);
  expect(result[0].messages.every((e) => e.ruleId === 'chanjet/ban-import-from-modules')).toBe(true);
});
