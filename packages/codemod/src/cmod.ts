#!/usr/bin/env node
import { green, grey, yellow } from 'chalk';
import { execSync } from 'child_process';
import { printTable } from 'console-table-printer';
import { sync } from 'glob';
import JestWorker from 'jest-worker';
import minimist from 'minimist';
import ora from 'ora';
import { isAbsolute } from 'path';

// prettier-ignore
const { _: [cmd, ...cmdArgs], ...cmdOpts } = minimist(process.argv.slice(2));

const Commands = {
  eslint: {
    title: 'eslint fix-import-type',
    path: require.resolve('./code-mods/eslint'),
  },
  src: {
    title: '修复模块导入路径',
    path: require.resolve('./code-mods/src-alias'),
  },
};

const currentCmd = Commands[cmd as 'eslint' | 'src'];
const CommandTitle = green(currentCmd.title);
const CommandPath = currentCmd.path;

const spinner = ora(yellow(CommandTitle + '\n\n'));

// 执行
run().catch((err) => {
  spinner.fail(err.message);
  console.trace(err);
  process.exitCode = 1;
});

async function run() {
  const startTime = new Date().getTime();
  const filePaths = getFiles().filter((fpath) => isAbsolute(fpath));
  // print file list
  cmdOpts.showfile && printTable(filePaths.map((f, i) => ({ index: i, file: f })));
  spinner.start();
  await workerRun(filePaths);
  const eatTime = (new Date().getTime() - startTime) / 1000;
  spinner.succeed(green(`${CommandTitle} 用时 ${yellow(eatTime)} 秒`));
}

async function workerRun(filePaths: string[]) {
  const commandWorker = new JestWorker(CommandPath, {
    exposedMethods: ['transform'],
    numWorkers: 6,
    enableWorkerThreads: true,
    forkOptions: {
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

  return cmdOpts.changed || cmdOpts.c
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
