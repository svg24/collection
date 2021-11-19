import { promises as fs } from 'fs';
import svgo from 'svgo';
import { checkIsSVG } from './utils';

const SOURCE = './src';
const OUTPUT = './packages/vanilla';
const PRE_SVGO_OPTIONS = {
  plugins: [
    'cleanupAttrs',
    'cleanupEnableBackground',
    'cleanupIDs',
    'cleanupNumericValues',
    'collapseGroups',
    'convertColors',
    'convertEllipseToCircle',
    'convertPathData',
    'convertShapeToPath',
    'convertShapeToPath',
    'mergePaths',
    'moveGroupAttrsToElems',
    'removeComments',
    'removeDesc',
    'removeDimensions',
    'removeDoctype',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'removeEmptyText',
    'removeHiddenElems',
    'removeMetadata',
    'removeNonInheritableGroupAttrs',
    'removeTitle',
    'removeUnknownsAndDefaults',
    'removeUnusedNS',
    'removeUselessDefs',
    'removeUselessStrokeAndFill',
    'removeViewBox',
    'removeXMLProcInst',
    'sortAttrs',
    'sortDefsChildren',
  ],
};
const POST_SVGO_OPTIONS = {
  js2svg: {
    indent: 2,
    pretty: true,
  },
  plugins: [
    'cleanupIDs',
    'cleanupNumericValues',
    'convertColors',
    'removeDesc',
    'removeDimensions',
    'removeEditorsNSData',
    'removeUnknownsAndDefaults',
    'removeUnusedNS',
    'removeUselessStrokeAndFill',
    'removeXMLProcInst',
    'sortAttrs',
    'sortDefsChildren',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{
          'aria-hidden': 'true',
        }],
      },
    },
  ],
};

/**
 * @param {string} name
 * @returns {string | null}
 */
const getFileVersion = (name) => {
  const match = name.match(/.+-v(?<ver>.*).svg/);
  const ver = match ? match.groups.ver : null;

  return ver;
};

const pre = {
  /**
   * @param {string} dir
   * @returns {Promise<[string, { root: string, file: string }]>}
   */
  write: async (dir) => {
    const root = `${SOURCE}/${dir}`;
    const items = await fs.readdir(root);
    const res = [];

    await Promise.all(items.map(async (item) => {
      if (!checkIsSVG(item)) return;

      const ver = getFileVersion(item);
      const local = {
        root: `${OUTPUT}/${dir}`,
        file: `${dir}.svg`,
        get toDir() {
          return ver ? `${local.root}/${ver}` : `${local.root}`;
        },
        get toFile() {
          return `${local.toDir}/${local.file}`;
        },
      };
      const buf = await fs.readFile(`${root}/${item}`);
      const { data } = svgo.optimize(buf, PRE_SVGO_OPTIONS);

      await fs.mkdir(local.toDir, { recursive: true });
      await fs.writeFile(local.toFile, data, 'utf8');

      res.push([ver, {
        root: local.root,
        file: local.file,
      }]);
    }));

    return res;
  },

  /**
   * @param {[string, { root: string, file: string }]} res
   * @returns {Promise<void>}
   */
  bind: async (res) => {
    const index = res.reduce((prevIndex, [curVal], curIndex, arr) => {
      const prev = (new Date(arr[prevIndex])).getTime();
      const cur = (new Date(curVal)).getTime();

      return !prevIndex || cur > prev ? curIndex : prevIndex;
    }, null);
    const [ver, local] = res[index];

    if (ver) {
      await fs.symlink(`${ver}/${local.file}`, `${local.root}/${local.file}`);
    }
  },

  /**
   * @param {string[] | []} dirs
   * @returns {Promise<void>}
   */
  process: async (dirs) => {
    if (dirs.length) {
      await Promise.all(dirs.map(async (dir) => {
        const res = await pre.write(dir);

        await pre.bind(res);
      }));

      return;
    }

    const dirents = await fs.readdir(SOURCE, {
      withFileTypes: true,
    });

    await Promise.all(dirents.map(async (dirent) => {
      if (dirent.isDirectory()) {
        const res = await pre.write(dirent.name);

        await pre.bind(res);
      }
    }));
  },
};

const post = {
  /**
   * @param {string} dir
   * @returns {Promise<void>}
   */
  write: async (dir) => {
    /**
     * @param {string} root
     * @param {Dirent[]} dirents
     * @returns {Promise<void>}
     */
    const write = async (root, dirents) => {
      await Promise.all(dirents.map(async (dirent) => {
        const cur = `${root}/${dirent.name}`;

        if (dirent.isDirectory()) {
          const sub = await fs.readdir(cur, { withFileTypes: true });

          await write(cur, sub);

          return;
        }

        if (dirent.isFile() && checkIsSVG(dirent.name)) {
          const buf = await fs.readFile(cur);
          const { data } = svgo.optimize(buf, POST_SVGO_OPTIONS);

          await fs.writeFile(cur, data, 'utf8');
        }
      }));
    };

    const root = `${OUTPUT}/${dir}`;
    const dirents = await fs.readdir(root, { withFileTypes: true });

    await write(root, dirents);
  },

  /**
   * @param {string[] | []} dirs
   * @returns {Promise<void>}
   */
  process: async (dirs) => {
    if (dirs.length) {
      await Promise.all(dirs.map(async (dir) => {
        await post.write(dir);
      }));

      return;
    }

    const dirents = await fs.readdir(OUTPUT, { withFileTypes: true });

    await Promise.all(dirents.map(async (dirent) => {
      if (dirent.isDirectory()) await post.write(dirent.name);
    }));
  },
};

async function main() {
  const [, , mode, ...dirs] = process.argv;

  switch (mode) {
    case 'pre': {
      await pre.process(dirs);
      break;
    }
    case 'post': {
      await post.process(dirs);
      break;
    }
    default: {
      throw new Error('Please specify a mod (pre, post)');
    }
  }
}

main();
