import { promises as fs } from 'fs';
import {
  checkIsSVG,
  getLastInPath,
  toCamelCase,
  toCamelCaseFromSvg,
} from '../utils';

const SOURCE = './packages/vanilla';

/**
 * @param {[string, string[]][]} total
 * @param {any} libs
 * @returns {Promise<void>}
 */
const writeRoot = async (total, libs) => {
  const res = total
    .sort(([a], [b]) => a > b)
    .map(([dir, names]) => {
      const sorted = names.sort();
      const list = `{\n  ${sorted.join(',\n  ')},\n}`;

      return ({
        cjs: [
          `const ${list} = require('./${dir}');`,
          sorted.map((name) => `exports.${name} = ${name};`).join('\n'),
        ],
        js: [
          `import ${list} from './${dir}';`,
          `export ${list};`,
        ],
        ts: [
          `import type ${list} from './${dir}';`,
          `export ${list};`,
        ],
      });
    })
    .reduce((acc, cur) => {
      Object.keys(cur).forEach((key) => {
        acc[key][0] += `${cur[key][0]}\n`;
        acc[key][1] += `${cur[key][1]}\n`;
      });

      return acc;
    }, {
      cjs: ['', ''],
      js: ['', ''],
      ts: ['', ''],
    });

  await Promise.all(libs.map(async (lib) => {
    const out = `${lib.output}/index`;

    await fs.writeFile(`${out}.cjs`, `${res.cjs[0]}\n${res.cjs[1]}`, 'utf8');
    await fs.writeFile(`${out}.js`, `${res.js[0]}\n${res.js[1]}`, 'utf8');
    await fs.writeFile(`${out}.d.ts`, `${res.ts[0]}\n${res.ts[1]}`, 'utf8');
  }));
};

/**
 * @param {string[]} names
 * @returns {{cjs: [string, string], js: [string, string], ts: [string, string]}}
 */
const getIndexes = (names) => ({
  cjs: [
    names.map((com) => `const { ${com} } = require('./${com}');`).join('\n'),
    names.map((com) => `exports.${com} = ${com};`).join('\n'),
  ],
  js: [
    names.map((com) => `import { ${com} } from './${com}';`).join('\n'),
    `export {\n  ${names.join(',\n  ')},\n};`,
  ],
  ts: [
    names.map((com) => `import type { ${com} } from './${com}';`).join('\n'),
    `export {\n  ${names.join(',\n  ')},\n};`,
  ],
});

/**
 * @param {string} dir
 * @param {any[]} libs
 * @returns {Promise<[string, string[]]>}
 */
const writeComponents = async (dir, libs) => {
  const res = [];

  const handler = async (root) => {
    const names = [];
    let link = null;

    /**
     * @param {string} cur
     * @returns {Promise<void>}
     */
    const handleDir = async (cur) => {
      await handler(cur);
    };

    /**
     * @param {string} cur
     * @returns {Promise<void>}
     */
    const handleLink = async (cur) => {
      link = await fs.realpath(cur);
    };

    /**
     * @param {string} cur
     * @param {string} file
     * @returns {Promise<void>}
     */
    const handleFile = async (cur, file) => {
      const buf = await fs.readFile(cur);
      const name = toCamelCaseFromSvg(file);

      names.push(name);

      await Promise.all(libs.map(async (lib) => {
        const { cjs, js, ts } = await lib.getCode(name, buf);
        const out = `${lib.output}/${toCamelCase(dir)}/`;

        await fs.mkdir(out, { recursive: true });
        await fs.writeFile(`${out}${name}.cjs`, cjs, 'utf8');
        await fs.writeFile(`${out}${name}.js`, js, 'utf8');
        await fs.writeFile(`${out}${name}.d.ts`, ts, 'utf8');
      }));
    };

    const dirents = await fs.readdir(root, { withFileTypes: true });

    await Promise.all(dirents.map(async (dirent) => {
      const cur = `${root}/${dirent.name}`;

      if (dirent.isDirectory()) {
        await handleDir(cur);
        return;
      }

      if (!checkIsSVG(dirent.name)) return;

      if (dirent.isSymbolicLink()) {
        await handleLink(cur);
        return;
      }

      if (dirent.isFile()) {
        await handleFile(cur, dirent.name);
      }
    }));

    const indexes = [];

    await Promise.all(libs.map(async (lib) => {
      const name = toCamelCase(dir);
      const output = {
        file: `${lib.output}/${name}/index`,
        data: {
          cjs: null,
          js: null,
          ts: null,
        },
      };
      const { cjs, js, ts } = getIndexes(names);

      if (link) {
        indexes.push(name);

        const latest = {
          name: toCamelCaseFromSvg((getLastInPath(link))),
          buf: await fs.readFile(link),
        };

        output.data = {
          cjs: `${cjs[0]}\n\nexports.${name} = ${latest.name};\n${cjs[1]}\n`,
          js: `${js[0]}\n\nexport const ${name} = ${latest.name};\n\n${js[1]}\n`,
          ts: `${ts[0]}\n\nexport ${lib.getType(name, latest.buf)}\n\n${ts[1]}\n`,
        };
      } else {
        output.data = {
          cjs: `${cjs[0]}\n\n${cjs[1]}\n`,
          js: `${js[0]}\n\n${js[1]}\n`,
          ts: `${ts[0]}\n\n${ts[1]}\n`,
        };
      }

      await fs.writeFile(`${output.file}.cjs`, output.data.cjs, 'utf8');
      await fs.writeFile(`${output.file}.js`, output.data.js, 'utf8');
      await fs.writeFile(`${output.file}.d.ts`, output.data.ts, 'utf8');
    }));

    res.push(toCamelCase(getLastInPath(root)), [...names, ...indexes]);
  };

  await handler(`${SOURCE}/${dir}`);

  return res;
};

/**
 * @param {string[] | []} dirs
 * @param {any[]} libs
 * @returns {Promise<void>}
 */
export const proc = async (dirs, libs) => {
  const dirents = dirs.length
    ? dirs
    : await fs.readdir(SOURCE, { withFileTypes: true });
  const total = [];

  await Promise.all(dirents.map(async (dirent) => {
    if (dirent.isDirectory()) {
      const local = await writeComponents(dirent.name, libs);

      total.push(local);
    }
  }));

  await writeRoot(total, libs);
};
