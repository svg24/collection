import { promises as fs } from 'fs';
import {
  checkIsSVG,
  getLastInPath,
  getPreview,
  toCamelCase,
  toCamelCaseFromSvg,
} from '../utils';

const SOURCE = './packages/vanilla';

/**
 * @param {string[]} names
 * @param {{ cjs: string, js: string, ts: string }} index
 * @returns {{ cjs: string, js: string, ts: string }}
 */
const getIndexes = (names, index) => {
  const base = {
    cjs: [
      names.map((com) => `const { ${com} } = require('./${com}');`).join('\n'),
      `${names.map((com) => `exports.${com} = ${com};`).join('\n')}\n`,
    ],
    js: [
      names.map((com) => `import { ${com} } from './${com}';`).join('\n'),
      `export { ${names.join(', ')} };\n`,
    ],
    ts: [
      names.map((com) => `import type { ${com} } from './${com}';`).join('\n'),
      `export { ${names.join(', ')} };\n`,
    ],
  };

  return index
    ? {
      cjs: `${base.cjs[0]}\n\n${index.cjs}\n\n${base.cjs[1]}`,
      js: `${base.js[0]}\n\n${index.js}\n\n${base.js[1]}`,
      ts: `${base.ts[0]}\n\n${index.ts}\n\n${base.ts[1]}`,
    }
    : {
      cjs: `${base.cjs[0]}\n\n${base.cjs[1]}`,
      js: `${base.js[0]}\n\n${base.js[1]}`,
      ts: `${base.ts[0]}\n\n${base.ts[1]}`,
    };
};

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
      const list = `{ ${sorted.join(', ')} }`;
      const exp = `  ${sorted.join(',\n  ')},`;

      return ({
        cjs: [
          `const ${list} = require('./${dir}');`,
          sorted.map((name) => `exports.${name} = ${name};`).join('\n'),
        ],
        js: [`import ${list} from './${dir}';`, exp],
        ts: [`import type ${list} from './${dir}';`, exp],
      });
    })
    .reduce((acc, cur) => {
      Object.keys(cur).forEach((key) => {
        acc[key][0] += `${cur[key][0]}\n`;
        acc[key][1] += `${cur[key][1]}\n`;
      });

      return acc;
    }, { cjs: ['', ''], js: ['', ''], ts: ['', ''] });

  await Promise.all(libs.map(async (lib) => {
    const out = `${lib.output}/index`;

    await fs.writeFile(`${out}.cjs`, `${res.cjs[0]}\n${res.cjs[1]}`, 'utf8');
    await fs.writeFile(`${out}.js`, `${res.js[0]}\nexport {\n${res.js[1]}};\n`, 'utf8');
    await fs.writeFile(`${out}.d.ts`, `${res.ts[0]}\nexport {\n${res.ts[1]}};\n`, 'utf8');
  }));
};

/**
 * @param {string} dir
 * @param {any[]} libs
 * @returns {Promise<[string, string[]]>}
 */
const writeComponents = async (dir, libs) => {
  const res = [];

  const handler = async (root) => {
    const components = {
      dir: toCamelCase(dir),
      names: [],
      index: null,
    };

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
      components.index = await fs.realpath(cur);
    };

    /**
     * @param {string} cur
     * @param {string} file
     * @returns {Promise<void>}
     */
    const handleFile = async (cur, file) => {
      const name = toCamelCaseFromSvg(file);
      const buf = await fs.readFile(cur);
      const content = buf.toString();
      const preview = getPreview(name, buf);

      components.names.push(name);

      await Promise.all(libs.map(async (lib) => {
        const { cjs, js, ts } = await lib.getCode(name, content, preview);
        const output = `${lib.output}/${components.dir}/`;

        await fs.mkdir(output, { recursive: true });
        await fs.writeFile(`${output}${name}.cjs`, `${cjs}\n`, 'utf8');
        await fs.writeFile(`${output}${name}.js`, `${js}\n`, 'utf8');
        await fs.writeFile(`${output}${name}.d.ts`, `${ts}\n`, 'utf8');
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

    await Promise.all(libs.map(async (lib) => {
      const output = {
        file: `${lib.output}/${components.dir}/index`,
        data: { cjs: null, js: null, ts: null },
      };

      if (components.index) {
        const latest = toCamelCaseFromSvg(getLastInPath(components.index));
        const buf = await fs.readFile(components.index);
        const preview = getPreview(components.dir, buf);

        output.data = getIndexes(components.names, {
          cjs: `exports.${components.dir} = ${latest};`,
          js: `export const ${components.dir} = ${latest};`,
          ts: `${preview}export declare function ${components.dir}(): typeof ${latest};`,
        });
      } else {
        output.data = getIndexes(components.names);
      }

      await fs.writeFile(`${output.file}.cjs`, output.data.cjs, 'utf8');
      await fs.writeFile(`${output.file}.js`, output.data.js, 'utf8');
      await fs.writeFile(`${output.file}.d.ts`, output.data.ts, 'utf8');
    }));

    res.push(components.dir, [
      ...components.names,
      ...components.index ? [components.dir] : [],
    ]);
  };

  await handler(`${SOURCE}/${dir}`);

  return res;
};

/**
 * @param {any[]} libs
 * @returns {Promise<void>}
 */
export const proc = async (libs) => {
  const total = [];
  const dirents = await fs.readdir(SOURCE, { withFileTypes: true });

  await Promise.all(dirents.map(async (dirent) => {
    if (dirent.isDirectory()) {
      const local = await writeComponents(dirent.name, libs);

      total.push(local);
    }
  }));

  await writeRoot(total, libs);
};
