/* --------------------------------- Import --------------------------------- */

import { resolve } from 'path';
import { readdirSync, readFileSync } from 'fs';
import execa from 'execa';
import { prerelease } from 'semver';
import { version as currentVersion } from '../package.json';

/* -------------------------------- Variable -------------------------------- */

const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts });
const getPkgRoot = (pkg) => resolve(__dirname, '../packages/' + pkg);

const packages = readdirSync(resolve(__dirname, '../packages')).filter((p) => !p.endsWith('.ts') && !p.startsWith('.'));

/* ----------------------------------- Run ---------------------------------- */

main().catch((err) => {
  console.error(err);
});

/* ------------------------------ Function Util ----------------------------- */

// main function
async function main() {
  let targetVersion = currentVersion;

  // prettier-ignore
  const releaseTag = Array.isArray(prerelease(targetVersion)) 
    ? prerelease(targetVersion)[0] 
    : 'latest';

  for (const pkg of packages) {
    await publish(pkg, releaseTag);
  }
}

async function publish(pkgName /* releaseTag */) {
  const pkgRoot = getPkgRoot(pkgName);
  const pkg = readPkg(pkgRoot);
  if (!pkg.private) {
    await run('npm', ['publish'], {
      cwd: pkgRoot,
    });
  }
}

function readPkg(pkgRoot) {
  const pkgPath = resolve(pkgRoot, 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf-8'));
}
