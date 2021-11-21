import { promises as fs } from 'fs';
import svgo from 'svgo';
import { checkIsSVG, getFileVersion } from '../utils';

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

/**
 * @param {string} dir
 * @returns {Promise<[string, string]>}
 */
const write = async (dir) => {
  const root = `${SOURCE}/${dir}`;
  const items = await fs.readdir(root);
  const res = [];

  await Promise.all(items.map(async (item) => {
    if (!checkIsSVG(item)) return;

    const buf = await fs.readFile(`${root}/${item}`);
    const { data } = svgo.optimize(buf, PRE_SVGO_OPTIONS);
    const subRoot = `${OUTPUT}/${dir}`;

    await fs.mkdir(subRoot, { recursive: true });
    await fs.writeFile(`${subRoot}/${item}`, data, 'utf8');

    res.push([subRoot, item]);
  }));

  return res;
};

/**
 * @param {string} dir
 * @param {[string, string]} res
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
  if (dirs.length) {
    await Promise.all(dirs.map(async (dir) => {
      const res = await write(dir);

      await bind(dir, res);
    }));

    return;
  }

  const dirents = await fs.readdir(SOURCE, {
    withFileTypes: true,
  });

  await Promise.all(dirents.map(async (dirent) => {
    if (dirent.isDirectory()) {
      const res = await write(dirent.name);

      await bind(dirent.name, res);
    }
  }));
};
