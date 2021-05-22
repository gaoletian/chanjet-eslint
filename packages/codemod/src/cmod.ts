#!/usr/bin/env node
import { green, grey, yellow } from 'chalk';
import { execSync } from 'child_process';
import { printTable } from 'console-table-printer';
import { sync } from 'glob';
import JestWorker from 'jest-worker';
import minimist from 'minimist';
import ora from 'ora';
import { isAbsolute } from 'path';

interface ICmdOption {
  showfile?: boolean;
  changed?: boolean;
  help?: boolean;
  dry?: boolean;
}

const { cmd, cmdArgs, cmdOpts } = parseArgs();

const commandResolve = (cmd: string) => require.resolve('./commands/' + cmd);

const Commands = {
  eslint: {
    title: 'eslint fix-import-type',
    path: commandResolve('eslint'),
  },
  src: {
    title: '修复模块导入路径',
    path: commandResolve('src-alias'),
  },
};

const currentCmd = Commands[cmd as 'eslint' | 'src'];

/* ---------------------------------- 帮助信息 ---------------------------------- */

if (!currentCmd || cmdOpts?.help) {
  showHelper();
  process.exit(0);
}

const CommandTitle = green(currentCmd.title);
const CommandPath = currentCmd.path;

let spinner: ora.Ora;

// 执行
run().catch((err) => {
  spinner.fail(err.message);
  process.exitCode = 1;
});

function parseArgs() {
  const {
    _: [cmd, ...cmdArgs],
    ...cmdOpts
  } = minimist(process.argv.slice(2));
  return { cmd, cmdArgs, cmdOpts: cmdOpts as ICmdOption };
}

async function run() {
  const startTime = new Date().getTime();
  const filePaths = getFiles().filter((fpath) => isAbsolute(fpath));
  // dry mode or print file list
  if (cmdOpts.showfile) {
    printTable(filePaths.map((f, i) => ({ index: i, file: f })));
  }

  if (cmdOpts.dry) {
    process.stdout.write(
      JSON.stringify({
        filePaths,
        currentCmd,
      })
    );
    return;
  }

  spinner = ora(yellow(CommandTitle + '\n\n')).start();

  if (!cmdOpts.dry) {
    await workerRun(filePaths);
  }
  const eatTime = (new Date().getTime() - startTime) / 1000;
  spinner.succeed(green(`${CommandTitle} 用时 ${yellow(eatTime)} 秒`));
}

async function workerRun(filePaths: string[]) {
  const commandWorker = new JestWorker(CommandPath, {
    exposedMethods: ['transform'],
    numWorkers: 6,
    enableWorkerThreads: true,
    forkOptions: {
      // @ts-ignore
      env: cmdOpts,
    },
  }) as JestWorker & { transform: (file: string) => void };

  commandWorker.getStdout().on('data', (data) => {
    spinner.text = CommandTitle + '  ' + grey(data.toString('utf8'));
  });

  commandWorker.getStderr().pipe(process.stderr);

  // run command
  await Promise.all(filePaths.map((file) => commandWorker.transform(file)));
  await commandWorker.end();
}

function execSyncReturnArray(command: string) {
  try {
    return execSync(command, { encoding: 'utf8' }).split('\n');
  } catch (err) {
    return [];
  }
}

function getFiles() {
  const globPattern = cmdArgs[0] || 'src/**/*.{ts,tsx}';

  return cmdOpts.changed
    ? gitDiffOnlyName({ absolute: true })
    : sync(globPattern, { cwd: process.cwd(), absolute: true });
}

function gitDiffOnlyName({ absolute = false }) {
  // eslint-disable-next-line no-useless-escape
  const absoluteOption = absolute ? `--line-prefix="\$(pwd)/"` : '';

  return [
    // 工作区 列出未添加到暂存区的文件列表
    ...execSyncReturnArray(`git diff --name-only --diff-filter=AM ${absoluteOption} | grep ${process.cwd()}/src`),
    // 暂存区 列出已通过 git add 添加到暂存区的文件列表
    ...execSyncReturnArray(
      `git diff --name-only --cached --diff-filter=AM ${absoluteOption} | grep ${process.cwd()}/src`
    ),
  ];
}

function showHelper() {
  const help = `
用法：
cmod [ tosrc|eslint ] <options>
选项：
--changed   只处理改动的文件, 未指定选项,则处理src目录下的所有js,jsx,ts,tsx文件
--showfile  打印文件列表
例子：
cmod tostr --changed --showfile
`;
  process.stdout.write(help);
}
