import { promises as fs } from 'fs';
import svgo from 'svgo';
import { checkIsSVG } from '../utils';

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
 * @returns {Promise<void>}
 */
const write = async (dir) => {
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
      }
    }));
  };

  const root = `${OUTPUT}/${dir}`;
  const dirents = await fs.readdir(root, { withFileTypes: true });

  await handler(root, dirents);
};

/**
 * @param {string[] | []} dirs
 * @returns {Promise<void>}
 */
export const process = async (dirs) => {
  await Promise.all(dirs.map(async (dir) => {
    await write(dir);
  }));
};
