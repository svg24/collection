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
