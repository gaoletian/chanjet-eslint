/* eslint-disable @typescript-eslint/no-var-requires */

// Invoked on the commit-msg git hook by yorkie.

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const msgPath = process.env.GIT_PARAMS;
const msg = fs.readFileSync(msgPath, 'utf-8').trim();

const scopes = fs.readdirSync(path.join(__dirname, '../packages')).join('|');
const actions = '(feat|fix|docs|refactor|perf|test|workflow|build|ci|chore|wip|release)';
let commitRE = new RegExp(`^${actions}(\\((${scopes})\\))?: .{1,80}`);
const ignoreRE = /^Merge.*/i;

const commitTag = `${chalk.bgBlue.white(' 提交 ')}`;
const errorTag = `${chalk.bgRed.white(' 错误 ')}`;
const exmapleTag = `${chalk.bgGreen.white(' 举例 ')}`;

const errorMsg = chalk.red(`本次提交不符合规范 ${commitRE}`);
const example = [
  chalk.green('feat(client): 增加jsonp封装'),
  chalk.green('fix(plugins): plugin包bug修复'),
  chalk.green('chore: 杂项更改如 internal-script'),
  chalk.green('refactor(login): 功能重构'),
  chalk.green('test(login): login包单元测试相关'),
  chalk.green('docs: 更新readme'),
].join('\n       ');

const finalResult = (msg) => `${commitTag} ${msg} \n\n${errorTag} ${errorMsg} \n\n${exmapleTag} ${example}`;
if (!commitRE.test(msg) && !ignoreRE.test(msg)) {
  console.log();
  console.error(finalResult(msg));
  process.exit(1);
}
