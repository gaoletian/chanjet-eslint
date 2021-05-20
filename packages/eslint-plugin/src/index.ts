import fs from 'fs';
import path from 'path';

const files = fs.readdirSync(path.join(__dirname, 'rules'));
const rules = Object.fromEntries(
  files
    .filter((filename) => filename.slice(-3) === '.js')
    .map((filename) => {
      const ruleName = filename.replace('.js', '');
      const rulePath = path.join(__dirname, `rules/${filename}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return [ruleName, require(rulePath).default];
    })
);

export { rules };
