import { getModuleFullPath, removeIndexAndExt } from '../src/pathUtil';
describe('pathUtil', () => {
  test('getModuleFullPath', () => {
    let filepath = '/root/src/api/index.ts';
    let fixture = [
      [`import React from 'react'`, ''],
      [`import api from "../api"`, '/root/src/api'],
      [`import api from '../api'`, '/root/src/api'],
      [`import("../api")`, '/root/src/api'],
      ['import(`../api`)', '/root/src/api'],
      ['import(`../api/`)', '/root/src/api/'],
      ['require(`../api`)', '/root/src/api'],
      [`import api from "../api"`, '/root/src/api'],
      ['require(`src/api/${name}`)', '/root/src/api/'],
      ['require("src/static/img/" + name)', '/root/src/static/img/'],
    ];

    fixture.forEach(([input, output]) => {
      expect(getModuleFullPath(input, filepath)).toBe(output);
    });
  });
  test('removeIndexAndExt', () => {
    let fixture = [
      ['src/index.scss', 'src/index.scss'],
      ['src/foo/index.tsx', 'src/foo'],
      ['src/foo/index.ts', 'src/foo'],
      ['src/foo/index.js', 'src/foo'],
      ['src/foo/index.jsx', 'src/foo'],
      ['src/foo/bar.tsx', 'src/foo/bar'],
      ['../foo/index.tsx', '../foo'],
      ['../index/', '../index/'],
      ['./index.scss', './index.scss'],
      ['./index.mjs', '.'],
      ['../index.mjs', '..'],
    ];
    fixture.forEach(([input, output]) => {
      expect(removeIndexAndExt(input)).toBe(output);
    });
  });
});
