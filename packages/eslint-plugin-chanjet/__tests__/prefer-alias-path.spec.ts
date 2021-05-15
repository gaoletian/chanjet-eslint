import { createESlint } from './testUtil';

describe('rule test', () => {
  const linter = createESlint({
    'chanjet/prefer-alias-path': 'error',
  });

  // test('case 1', async () => {
  //   const filePath = fixtureResolve('./fixture/prefer-appcontext-api.ts');
  //   const code = await readfileAsync(filePath, { encoding: 'utf-8' });
  //   const result = await linter.lintText(code, {
  //     filePath,
  //   });

  //   expect(result).toMatchSnapshot();
  // });
  test('chanjet/prefer-alias-path should work', async () => {
    const rawSource = [
      `import api from '../../api'`,
      `import api from "../../api"`,
      `import('../../api');`,
      `import("../../api");`,
      `const api = require('../../api')`,
      `const api = require("../../api")`,
      `require('../../api/' + name)`,
      `require("../../api/" + name)`,
      'require(`../../api/` + name)',
      'require(`../../api/${name}`)',
      `require.context('../../api/' + name)`,
      `require.context("../../api/" + name)`,
      'require.context(`../../api/` + name)',
      'require.context(`../../api/${name}`)',
    ].join('\n');
    const rawSourceFixed = rawSource.replace(/\.\.\/\.\./g, 'src');
    let result = await linter.lintText(rawSource, { filePath: '/root/src/modules/foo/index.ts' });
    expect(result[0].output).toBe(rawSourceFixed);
  });
});
