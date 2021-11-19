import path from 'path';

/**
 * @param {string} name
 * @returns {boolean}
 */
export const checkIsSVG = (name) => path.extname(name) === '.svg';
