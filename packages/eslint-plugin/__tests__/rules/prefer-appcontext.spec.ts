import { createESlint } from '../testUtil';

const onlytext = (str: string) => str.replace(/\n\s*\n/g, '\n');
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

describe('prefer-appcontext', () => {
  beforeEach(() => {
    jest.mock('fs-extra', () => {
      return fsMock;
    });
  });
  afterEach(() => {
    jest.unmock('fs-extra');
  });
  test('prefer-appcontext should work', async () => {
    const code = [
      `import {Foo} from 'src/api';`,
      `import httpcontext from 'src/api/httpcontext';`,
      `let foo = Foo;`,
      `let baz = httpcontext.appname;`,
      `httpcontext.foo();`,
    ].join('\n');

    const codeFixed = [
      `import * as AppContext from 'src/AppContext';`,
      `let foo = AppContext.api.Foo;`,
      `let baz = AppContext.api.httpcontext.appname;`,
      `AppContext.api.httpcontext.foo();`,
    ].join('\n');

    const linter = createESlint({
      '@chanjet/prefer-appcontext': 'error',
    });

    const filePath = '/root/src/modules/home/homepage.tsx';
    let result = await linter.lintText(code, { filePath });

    expect(result[0].output).not.toBeUndefined();
    // expect(result[0].output).toBe(codeFixed);
    expect(onlytext(result[0].output as string)).toBe(onlytext(codeFixed));
    await delay(60);
    expect(fsMock.appendFile).toBeCalled();
    expect(fsMock.appendFile).toMatchSnapshot();
  });
});
