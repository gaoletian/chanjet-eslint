v2.1.0-alpha.0 / 2024-04-28
===================



v2.0.0-alpha.0 / 2023-04-26
===================

### 🐛 Bug Fixes

- `codemod`
  - 升级typescript, jest, ..


### 💖 Thanks to

- gaoletian

v1.3.0 / 2021-07-14
===================

### 🐛 Bug Fixes

- `codemod`
  - Disable prefer-alias-path and prefer-appcontext fix-import-type default config
- `eslint-plugin`
  - Ban-import-from-modules 排除 import type


### 💖 Thanks to

- gaoletian

v1.2.0 / 2021-06-17
===================

### 🚀 Features

- `eslint-utils`
  - CodeUtil 代码生成单元
- `eslint-plugin`
  - 规则更新 perfer-alias-path 转换所有路径为src别名路径 fix-import-type 添加规则选项 from , target 正则 expose-chanjet 生成@chanjet私有包按需引用列表
- `codemod`
  - 添加--one 选项限定一个工作线程，通过配置，支持通过 --rule指定规则配置


### 💖 Thanks to

- gaoletian

v1.1.6 / 2021-05-24
===================

### 🚀 Features

- `eslint-plugin`
  - Prefer-alias-path also work for ExportNamedDeclaration, ExportAllDeclaration


### 🏡 Chore

- `eslint-utils`
  - Update getModuleDirPath comment


### 💖 Thanks to

- gaoletian

v1.1.5 / 2021-05-22
===================

### 🐛 Bug Fixes

- `codemod`
  - PeerDependencies @typescript-eslint/eslint-plugin


### 💖 Thanks to

- gaoletian

v1.1.4 / 2021-05-22
===================

### 🏡 Chore

- `general`
  - Fix release script


### 💖 Thanks to

- gaoletian

v1.1.3 / 2021-05-22
===================

### 🐛 Bug Fixes

- `eslint-utils`
  - Fix removeIndexAndExt  regexp


### 🏡 Chore

- `general`
  - Use yarn ci:publish publish to npm registry


### 👓 Tests

- `eslint-plugin`
  - Prefer-alias-path should not fixed like index.scss


### 💖 Thanks to

- gaoletian

v1.1.2 / 2021-05-22
===================

### 💅 Refactors

- `codemod`
  - Cmod cli test case
- `general`
  - Rename all package with @chanjet scoped


### 🏡 Chore

- `general`
  - VerifyCommit and changelog
  - VerifyCommit and changelog


### 👓 Tests

- `general`
  - Clean setup jest env
  - Update eslint rule with @chanjet/


### 💖 Thanks to

- gaoletian

v1.1.1 / 2021-05-19
===================

### 🚀 Features

- `chanjet-eslint-utils`
  - Add new package chanjet-eslint-utils


### 💅 Refactors

- `chanjet-codemod`
  - Use chanjet-eslint-utils
- `eslint-plugin-chanjet`
  - Code clean and refactor


### 🏡 Chore

- `general`
  - VerifyCommit and changelog
  - Change to monorepo + typescript + lerna


### 👓 Tests

- `eslint-plugin-chanjet`
  - Mv spec to __tests__/rules
  - Ban-import-from-modules, ban-this-in-arrowfunction rule test
  - Add  prefer-alias-path rule unit test
- `general`
  - Rewrite console.log
  - Enable code coverage


### 💖 Thanks to

- gaoletian

===================



