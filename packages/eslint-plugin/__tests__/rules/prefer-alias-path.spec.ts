import { createESlint } from '../testUtil';

describe('prefer-alias-path rule test', () => {
  const linter = createESlint({
    '@chanjet/prefer-alias-path': 'error',
  });
  test('prefer-alias-path should work', async () => {
    let raw: string
    let rawFixed: string;

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

    // prettier-ignore
    raw = [
      `import userStore from '../stores'`,
      `import bar from './bar'`,
      `import utils from '../../utils'`
    ].join('\n');
    rawFixed = [
      `import userStore from 'src/stores'`,
      `import bar from 'src/api/bar'`,
      `import utils from '/root/utils'`,
    ].join('\n');
    result = await linter.lintText(raw, { filePath: '/root/src/api/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });

  test('should remove /index.js,jsx,ts,tsx', async () => {
    // module path contain ext like '.js', '.ts'
    const raw = [
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
    const rawFixed = [
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
    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
  test('should presave last slash', async () => {
    const raw = [
      `import api from '../../api/'`,
      `import('../../api/')`,
      `require('../../api/' + name)`,
      'require(`../../api/${name}.png`)',
      `require.context('../../api/' + name)`,
      `require.context('src/static/img/share/' + name)`,
    ].join('\n');
    const rawFixed = [
      `import api from 'src/api/'`, // presave last /
      `import('src/api/')`, // presave last /
      `require('src/api/' + name)`, // presave last /
      'require(`src/api/${name}.png`)',
      `require.context('src/api/' + name)`, // presave last /
      `require.context('src/static/img/share/' + name)`, // presave last /
    ].join('\n');
    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
  test('should fix export from', async () => {
    // export path
    const raw = [
      `export {foo, bar} from '../../api/'`,
      `export type {foo, bar} from '../../api/'`,
      `export type {foo, bar, default as baz} from '../../api/'`,
      `export * from '../../api/'`,
    ].join('\n');
    const rawFixed = [
      `export {foo, bar} from 'src/api/'`,
      `export type {foo, bar} from 'src/api/'`,
      `export type {foo, bar, default as baz} from 'src/api/'`,
      `export * from 'src/api/'`,
    ].join('\n');
    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });

  test('should not fixed', async () => {
    // no need fix
    // prettier-ignore
    const raw = [
      'import "index.scss"',
      'import "./index.scss"',
      'import "../index.scss"',
      'import "src/index.scss"',
      'require("index.scss")',
      'require("./index.scss")',
      'require("../index.scss")',
      'require("../../index.scss")',
      'require("../../index.less")',
      'require("../../index.macro")',
    ].join('\n')
    const rawFixed = [
      'import "index.scss"',
      'import "src/modules/foo/index.scss"',
      'import "src/modules/index.scss"',
      'import "src/index.scss"',
      'require("index.scss")',
      'require("src/modules/foo/index.scss")',
      'require("src/modules/index.scss")',
      'require("src/index.scss")',
      'require("src/index.less")',
      'require("src/index.macro")',
    ].join('\n');

    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
  test('rule options', async () => {
    const linter = createESlint({
      '@chanjet/prefer-alias-path': [
        'error',
        { from: /src\/(api|utils)/, target: /src\/modules\//, aliasName: 'webhost' },
      ],
    });
    const raw = [
      'import React from "react"',
      'import "src/api"',
      'import "../../api"',
      'import "../../utils/foo.tsx"',
      'export {api} from "src/utils/foo.tsx"',
      'import "../utils/foo.ts"',
    ].join('\n');
    const rawFixed = [
      'import React from "react"',
      'import "webhost/api"',
      'import "webhost/api"',
      'import "webhost/utils/foo"',
      'export {api} from "webhost/utils/foo"',
      // 不符合from规则
      'import "../utils/foo.ts"',
    ].join('\n');

    const result = await linter.lintText(raw, { filePath: '/root/src/modules/foo/foo.ts' });
    expect(result[0].output).toBe(rawFixed);
  });
});
