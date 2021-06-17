import { createESlint } from '../testUtil';

const onlytext = (str: string) => str.replace(/(\s|\n)/g, '');
const fsMock = {
  appendFile: jest.fn(),
  ensureFile() {
    return true;
  },
  readFile() {
    return `export type {Foo} from 'src/module/foo`;
  },
};

const delay = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

describe('fix-import-type', () => {
  beforeEach(() => {
    jest.mock('fs-extra', () => {
      return fsMock;
    });
  });
  afterEach(() => {
    jest.unmock('fs-extra');
  });
  test('fix-import-type should work', async () => {
    const code = [
      `import type {Foo} from 'src/modules/foo';`,
      `import type Bar from 'src/modules/bar';`,
      `import type {default as Baz} from 'src/modules/baz';`,
      `let foo: Foo = null;`,
      `let bar: Bar = null;`,
      `let baz: Baz = null;`,
    ].join('');

    const codeFixed = [
      `let foo: ComponentsExternal.Foo = null;`,
      `let bar: ComponentsExternal.Bar = null;`,
      `let baz: ComponentsExternal.Baz = null;`,
    ].join('');

    const linter = createESlint({
      '@chanjet/fix-import-type': [
        'error',
        {
          target: /\/src\/components/,
          from: /\/src\/(modules|hkj)\//,
        },
      ],
    });

    const filePath = '/root/src/components/foo.ts';
    let result = await linter.lintText(code, { filePath });

    expect(result[0].output).not.toBeUndefined();
    expect(onlytext(result[0].output as string)).toBe(onlytext(codeFixed));
    await delay(60);
    expect(fsMock.appendFile).toBeCalled();
  });
});
