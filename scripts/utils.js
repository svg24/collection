import path from 'path';

/**
 * @param {string} name
 * @returns {boolean}
 */
export const checkIsSVG = (name) => path.extname(name) === '.svg';

/**
 * @param {string} str
 * @returns {string}
 */
export const toCamelCase = (str) => {
  const first = str[0].toUpperCase();
  const other = str
    .slice(1)
    .replace(/-(\w)/g, (_, char) => (char.toUpperCase()));

  return `${first}${other}`;
};

/**
 * @param {string} str
 * @returns {string}
 */
export const getLastInPath = (str) => str.match(/.+\/(?<file>.+)$/).groups.file;

/**
 * @param {string} file
 * @returns {string}
 */
export const toCamelCaseFromSvg = (file) => (
  toCamelCase(file.replace('.svg', ''))
);

/**
 * @param {string} name
 * @param {Buffer} buf
 * @returns {string}
 */
export const getPreview = (name, buf) => (
  `![${name}](data:image/svg+xml;base64,${
    Buffer.from(buf.toString().replace(
      '<svg',
      '<svg width="64" height="64"',
    )).toString('base64')
  })`
);
