import fs from 'fs-extra';

const Domains = {
  apphub: {
    regexp: /\/src\/(api|utils|stores|models|service|routers2|routers|config|metadata|data-sources|AppPresenter)/,
    cache: new Set<string>(),
    code() {
      return Array.from(this.cache)
        .sort()
        .map((it) => {
          // return `'${it.replace('src/modules/', './')}' : '${it}',`
          return `'${it}',`;
        })
        .join('\n');
    },
  },
  components: {
    regexp: /\/src\/components\//,
    cache: new Set<string>(),
    code() {
      return Array.from(this.cache)
        .sort()
        .map((it) => {
          // return `'${it.replace('src/modules/', './')}' : '${it}',`
          return `'${it}',`;
        })
        .join('\n');
    },
  },
  modules: {
    regexp: /\/src\/modules\//,
    cache: new Set<string>(),
    code() {
      return Array.from(this.cache)
        .sort()
        .map((it) => {
          // return `'${it.replace('src/modules/', './')}' : '${it}',`
          return `'${it}',`;
        })
        .join('\n');
    },
  },
  hkj: {
    regexp: /\/src\/hkj\//,
    cache: new Set<string>(),
    code() {
      return Array.from(this.cache)
        .sort()
        .map((it) => {
          // return `'${it.replace('src/modules/', './')}' : '${it}',`
          return `'${it}',`;
        })
        .join('\n');
    },
  },
};

const getDomain = (filePath: string) => {
  if (Domains.apphub.regexp.test(filePath)) return 'apphub';
  if (Domains.components.regexp.test(filePath)) return 'components';
  if (Domains.modules.regexp.test(filePath)) return 'modules';
  if (Domains.hkj.regexp.test(filePath)) return 'hkj';
  return null;
};

export const addDomainExposes = (modulePath: string, moduleFullPath: string, currentFile: string) => {
  // 相对路径不做处理
  if (modulePath.startsWith('.')) return;

  const fileDomain = getDomain(currentFile);
  const moduleDomain = getDomain(moduleFullPath);
  const isSameDomain = fileDomain === moduleDomain;

  if (moduleDomain && !isSameDomain && Domains[moduleDomain].cache.has(modulePath) === false) {
    Domains[moduleDomain].cache.add(modulePath);
  }
};

export const writeDomainExpose = async () => {
  await writeExposeChanjet();

  return Promise.all(
    Object.entries(Domains).map(async ([domainName, domain]) => {
      const fpath = process.cwd() + `/expose-${domainName}.js`;
      await fs.ensureFile(fpath);
      await fs.writeFile(fpath, domain.code());
    })
  );
};

const ExposeChanjet = new Set<string>();

export const addExposeChanjet = (modulePath: string) => {
  const code = `'${modulePath.replace('@chanjet', '.')}': '${modulePath}',`;
  if (ExposeChanjet.has(code)) return;
  ExposeChanjet.add(code);
};

export const writeExposeChanjet = async () => {
  const fpath = process.cwd() + '/expose-chanjet.js';
  await fs.ensureFile(fpath);
  const codes = Array.from(ExposeChanjet).sort();
  await fs.writeFile(fpath, codes.join('\n'));
};
