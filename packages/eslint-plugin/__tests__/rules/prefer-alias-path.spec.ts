import { createESlint } from '../testUtil';

describe('rule test', () => {
  const linter = createESlint({
    '@chanjet/prefer-alias-path': 'error',
  });
  test('@chanjet/prefer-alias-path should work', async () => {
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
      `import api2 from 'src/api/index.tsx'`,
      `import api2 from 'src/api/foo.ts'`,
      `import api2 from 'src/api/foo.js'`,
      `import api2 from 'src/api/foo.jsx'`,
      `import api2 from 'src/api/foo.mjs'`,
    ].join('\n');
    rawFixed = [
      `import api2 from 'src/api'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
      `import api2 from 'src/api/foo'`,
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

    // presave last '/'
    raw = [
      `import api from '../../api/'`,
      `import('../../api/')`,
      `require('../../api/' + name)`,
      'require(`../../api/${name}.png`)',
      `require.context('../../api/' + name)`,
      `require.context('src/static/img/share/' + name)`,
    ].join('\n');
    rawFixed = [
      `import api from 'src/api/'`, // presave last /
      `import('src/api/')`, // presave last /
      `require('src/api/' + name)`, // presave last /
      'require(`src/api/${name}.png`)',
      `require.context('src/api/' + name)`, // presave last /
      `require.context('src/static/img/share/' + name)`, // presave last /
    ].join('\n');
    result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });

  test('should not fixed', async () => {
    // no need fix
    // prettier-ignore
    const  raw = [
      'import "index.scss"',
      'import "./index.scss"',
      'import "../index.scss"',
      'import "src/index.scss"',
      'require("index.scss")',
      'require("./index.scss")',
      'require("../index.scss")',
      'require("../../index.scss")',
    ].join('\n')
    const rawFixed = [
      'import "index.scss"',
      'import "./index.scss"',
      'import "src/modules/index.scss"',
      'import "src/index.scss"',
      'require("index.scss")',
      'require("./index.scss")',
      'require("src/modules/index.scss")',
      'require("src/index.scss")',
    ].join('\n');

    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
});
