import { promises as fs } from 'fs';
import svgo from 'svgo';
import { checkIsSVG } from '../utils';

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
 * @returns {Promise<void>}
 */
const write = async (dir) => {
  const root = `${OUTPUT}/${dir}`;
  const items = await fs.readdir(root);

  await Promise.all(items.map(async (item) => {
    if (!checkIsSVG(item)) return;

    const buf = await fs.readFile(`${root}/${item}`);
    const { data } = svgo.optimize(buf, PRE_SVGO_OPTIONS);
    const local = `${OUTPUT}/${dir}`;

    await fs.mkdir(local, { recursive: true });
    await fs.writeFile(`${local}/${item}`, data, 'utf8');
  }));
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
