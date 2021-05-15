/* --------------------------------- Import --------------------------------- */

import minimist from 'minimist';
import { readdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { prerelease, inc as _inc, valid } from 'semver';
import { version as currentVersion } from '../package.json';
import { prompt } from 'enquirer';
import execa from 'execa';

/* -------------------------------- Variable -------------------------------- */

const args = minimist(process.argv.slice(2));
const preId = args.preid || (prerelease(currentVersion) && prerelease(currentVersion)[0]) || 'alpha';
const isDryRun = args.dry;
const isCi = args.ci;
const skipTests = args.skipTests;
const packages = readdirSync(resolve(__dirname, '../packages')).filter((p) => !p.endsWith('.ts') && !p.startsWith('.'));

const versionIncrements = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

const inc = (i) => _inc(currentVersion, i, preId);
const bin = (name) => resolve(__dirname, '../node_modules/.bin/' + name);
const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts });
const getPkgRoot = (pkg) => resolve(__dirname, '../packages/' + pkg);

/* ----------------------------------- Run ---------------------------------- */

main().catch((err) => {
  console.error(err);
});

/* ------------------------------ Function Util ----------------------------- */

async function main() {
  let targetVersion = !isCi ? args._[0] : inc('prepatch');

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map((i) => `${i} (${inc(i)})`).concat(['custom']),
    });

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion,
        })
      ).version;
    } else {
      targetVersion = release.match(/\((.*)\)/)[1];
    }
  }

  if (!valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`);
  }

  // 非ci环境下
  if (!isCi) {
    const { yes } = await prompt({
      type: 'confirm',
      name: 'yes',
      message: `Releasing v${targetVersion}. Confirm?`,
    });

    if (!yes) {
      return;
    }
  }

  // run tests before release
  if (!skipTests) {
    await run(bin('jest'), ['--clearCache']);
    await run('yarn', ['test']);
  }

  // update all package versions and inter-dependencies
  updateVersions(targetVersion);

  // build all packages with types
  // if (!skipBuild) {
  //     await run('yarn', ['build']);
  // }

  // all good...
  if (isDryRun) {
    // stop here so we can inspect changes to be committed
    // and packages built
    console.log('Dry run finished.');
  } else {
    // update changelog
    console.log('Updateing changelog...');
    await run('yarn', ['run', 'changelog', targetVersion]);

    // commit all changes
    console.log('Committing changes...');
    await run('git', ['add', '-A']);
    await run('git', ['commit', '-m', `release: v${targetVersion}`]);

    // publish packages 使用 jenkins发包, 本地不发包

    // push to Gitlab
    await run('git', ['tag', `v${targetVersion}`]);
    await run('git', ['push', 'origin']);
    await run('git', ['push', 'origin', `refs/tags/v${targetVersion}`]);
  }
}

function updateVersions(version) {
  console.log('Updating versions...');
  // 1. update root package.json
  updatePackage(resolve(__dirname, '..'), version);
  // 2. update all packages
  packages.forEach((p) => updatePackage(getPkgRoot(p), version));
}

function updatePackage(pkgRoot, version) {
  const pkgPath = resolve(pkgRoot, 'package.json');
  const pkg = readPkg(pkgRoot);
  pkg.version = version;
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((dep) => {
      let nameArr = dep.split('/');
      let pkgName = nameArr.length ? nameArr[1] : dep;
      if (packages.includes(pkgName)) {
        pkg.dependencies[dep] = version;
      }
    });
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function readPkg(pkgRoot) {
  const pkgPath = resolve(pkgRoot, 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf-8'));
}
