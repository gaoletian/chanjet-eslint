import { createESlint } from '../testUtil';
const linter = createESlint({
  'chanjet/ban-this-in-arrowfunction': 'error',
});

test('chanjet/ban-this-in-arrowfunction should work', async () => {
  let raw, result;
  raw = `
  console.log(this.name) // this is undefined should warn 
  const foo = () => console.log(this.name)  // this is undefined should warn
  const foo = () => console.log(this)  // this is undefined  should warn

  function Fn() { console.log(this.name) } // this is instance of Fn

  class Foo {
    foo = () => console.log(this); // this is Foo
  }
  `;
  result = await linter.lintText(raw, { filePath: '/root/src/foo.ts' });

  expect(result[0].errorCount).toBe(3);
});
