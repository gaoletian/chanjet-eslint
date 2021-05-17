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
    let raw, rawFixed;

    raw = [
      `import api from '../../api'`,
      `import api from "../../api"`,
      `import('../../api');`,
      `import("../../api");`,
      `const api = require('../../api')`,
      `const api = require("../../api")`,
      `const api = require("../../api/")`,
      `require('../../api/' + name)`,
      `require("../../api/" + name)`,
      'require(`../../api/` + name)',
      'require(`../../api/${name}`)',
      `require.context('../../api/' + name)`,
      `require.context("../../api/" + name)`,
      'require.context(`../../api/` + name)',
      'require.context(`../../api/${name}`)',
    ].join('\n');
    rawFixed = raw.replace(/\.\.\/\.\./g, 'src');

    let result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/index.ts' });
    expect(result[0].output).toBe(rawFixed);

    // module path contain ext like '.js', '.ts'

    raw = [
      `import api2 from '../../api/index.tsx'`,
      `import api2 from '../../api/foo.ts'`,
      `import api2 from '../../api/foo.js'`,
      `import api2 from '../../api/foo.jsx'`,
      `import api2 from '../../api/foo.mjs'`,
    ].join('\n');
    rawFixed = [
      `import api2 from 'src/api'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
    ].join('\n');

    result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });

    expect(result[0].output).toBe(rawFixed);

    // prettier-ignore
    raw = [
      `import userStore from '../stores'`, 
      `import bar from './bar'`, 
      `import utils from '../../utils'`
    ].join('\n');
    rawFixed = [
      `import userStore from 'src/stores'`,
      `import bar from './bar'`,
      `import utils from '/root/utils'`,
    ].join('\n');
    result = await linter.lintText(raw, { filePath: '/root/src/api/foo.ts' });
    expect(result[0].output).toBe(rawFixed);

    // only require or require.context presave last '/'
    raw = [
      `import api from '../../api/'`,
      `import('../../api/')`,
      `require('../../api/' + name)`,
      `require.context('../../api/' + name)`,
    ].join('\n');
    rawFixed = [
      `import api from 'src/api'`, // remove last /
      `import('src/api')`, // remove last /
      `require('src/api/' + name)`, // presave last /
      `require.context('src/api/' + name)`, // presave last /
    ].join('\n');
    result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
});
