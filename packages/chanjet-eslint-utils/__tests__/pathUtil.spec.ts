import { getModuleFullPath } from '../src/pathUtil';
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
});
