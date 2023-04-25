import { execSync } from 'child_process';
import path from 'path';

const execCmd = (cmdMock: string) => {
  const cmd = cmdMock.replace('cmod', `node ${path.join(__dirname, '../dist/cmod.js')}`);
  return execSync(cmd, { encoding: 'utf8' });
};

describe('cmod command test', () => {
  const helperInfo = 'cmod [ tosrc|eslint ] <options>';
  test('should show help', () => {
    expect(execCmd('cmod')).toContain(helperInfo);
    expect(execCmd('cmod ')).toContain(helperInfo);
    expect(execCmd('cmod --help')).toContain(helperInfo);
  });
  test('cmod --dry', () => {
    expect(execCmd('cmod src "packages/codemod/__tests__/fixture/**/*" --dry')).toMatchSnapshot();
    expect(execCmd('cmod src --dry')).toMatchSnapshot();
    expect(execCmd('cmod src --cached --dry')).toMatchSnapshot();
    expect(execCmd('cmod eslint "packages/codemod/__tests__/fixture/**/*" --dry')).toMatchSnapshot();
    expect(execCmd('cmod eslint --dry')).toMatchSnapshot();
    expect(execCmd('cmod eslint --cached --dry')).toMatchSnapshot();
  });
});
