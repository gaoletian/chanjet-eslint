// Invoked on the commit-msg git hook by yorkie.

import { bgBlue, bgRed, bgGreen, red, green } from 'chalk';
import fs from 'fs';

const msgPath = process.env.GIT_PARAMS;
const msg = fs.readFileSync(msgPath, 'utf-8').trim();

const commitRE =
  /^(revert: )?(feat|fix|docs|refactor|perf|test|workflow|build|ci|chore|wip|release)(\((client|common|components|login|plugins|router|store|theme|util)\))?: .{1,80}/;
const ignoreRE = /^Merge.*/i;

const commitTag = `${bgBlue.white(' 提交 ')}`;
const errorTag = `${bgRed.white(' 错误 ')}`;
const exmapleTag = `${bgGreen.white(' 举例 ')}`;

const errorMsg = red(`本次提交不符合规范 ${commitRE}`);
const example = [
  green('feat(client): 增加jsonp封装'),
  green('fix(plugins): plugin包bug修复'),
  green('chore: 杂项更改如 internal-script'),
  green('refactor(login): 功能重构'),
  green('test(login): login包单元测试相关'),
  green('docs: 更新readme'),
].join('\n       ');

const finalResult = (msg) => `${commitTag} ${msg} \n\n${errorTag} ${errorMsg} \n\n${exmapleTag} ${example}`;
if (!commitRE.test(msg) && !ignoreRE.test(msg)) {
  console.log();
  console.error(finalResult(msg));
  process.exit(1);
}
