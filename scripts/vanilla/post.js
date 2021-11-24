import { promises as fs } from 'fs';
import svgo from 'svgo';
import { checkIsSVG, getFileVersion } from '../utils';

const OUTPUT = './packages/vanilla';
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
 * @param {string} dir
 * @returns {Promise<[string, string][]>}
 */
const write = async (dir) => {
  const res = [];

  /**
   * @param {string} root
   * @param {Dirent[]} dirents
   * @returns {Promise<void>}
   */
  const handler = async (root, dirents) => {
    await Promise.all(dirents.map(async (dirent) => {
      const cur = `${root}/${dirent.name}`;

      if (dirent.isDirectory()) {
        const sub = await fs.readdir(cur, { withFileTypes: true });

        await handler(cur, sub);

        return;
      }

      if (dirent.isFile() && checkIsSVG(dirent.name)) {
        const buf = await fs.readFile(cur);
        const { data } = svgo.optimize(buf, POST_SVGO_OPTIONS);

        await fs.writeFile(cur, data, 'utf8');

        res.push([root, dirent.name]);
      }
    }));
  };

  const root = `${OUTPUT}/${dir}`;
  const dirents = await fs.readdir(root, { withFileTypes: true });

  await handler(root, dirents);

  return res;
};

/**
 * @param {string} dir
 * @param {[string, string][]} res
 * @returns {Promise<void>}
 */
const bind = async (dir, res) => {
  const index = res.reduce((prevIndex, [, curItem], curIndex, arr) => {
    const ver = getFileVersion(curItem);

    if (!ver) return null;

    const prev = (new Date(arr[prevIndex])).getTime();
    const cur = (new Date(ver)).getTime();

    return !prevIndex || cur > prev ? curIndex : prevIndex;
  }, null);

  if (index !== null) {
    const [root, item] = res[index];

    await fs.symlink(item, `${root}/${dir}.svg`);
  }
};

/**
 * @param {string[] | []} dirs
 * @returns {Promise<void>}
 */
export const process = async (dirs) => {
  await Promise.all(dirs.map(async (dir) => {
    const res = await write(dir);
    await bind(dir, res);
  }));
};
