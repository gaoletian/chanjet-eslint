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
      `import type {Foo} from 'src/module/foo';`,
      `import type Bar from 'src/module/bar';`,
      `import type {default as Baz} from 'src/module/baz';`,
      `let foo: Foo = null;`,
      `let bar: Bar = null;`,
      `let baz: Baz = null;`,
    ].join('');

    const codeFixed = [
      `let foo: StoresExternal.Foo = null;`,
      `let bar: StoresExternal.Bar = null;`,
      `let baz: StoresExternal.Baz = null;`,
    ].join('');

    const linter = createESlint({
      'chanjet/fix-import-type': 'error',
    });

    const filePath = '/root/src/stores/appStore.ts';
    let result = await linter.lintText(code, { filePath });
    expect(onlytext(result[0].output as string)).toBe(onlytext(codeFixed));
    await delay(60);
    expect(fsMock.appendFile).toBeCalled();
    expect(fsMock.appendFile).toMatchSnapshot();
  });
});
