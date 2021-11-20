import babel from '@babel/core';
import reactJSX from '@babel/plugin-transform-react-jsx';
import svgr from '@svgr/core';
import { getPreview } from '../utils';

const OUTPUT = './packages/react';

/**
 * @param {string} name
 * @param {Buffer} buf
 * @returns {string}
 */
const getDec = (name, buf) => (
  `/**
 * ${getPreview(name, buf)}
 */
declare function ${name}(
  props: React.ComponentProps<'svg'>,
  svgRef: React.ForwardedRef<SVGElement>,
): JSX.Element;`
);

/**
 * @type {string}
 */
export const output = OUTPUT;

/**
 * @param {string} name
 * @param {Buffer} buf
 * @returns {Promise<{ cjs: string, js: string, ts: string }>}
 */
export const getCode = async (name, buf) => {
  const component = await svgr.default(buf.toString(), {
    ref: true,
  }, { componentName: name });
  const { code } = await babel.transformAsync(component, {
    plugins: [[reactJSX, { useBuiltIns: true }]],
  });
  const imp = 'import * as React from';

  return {
    cjs: code
      .replace(`${imp} "react";`, 'const React = require(\'react\');')
      .replace('export default', `exports.${name} =`),
    js: code.replace(`default ${name};`, `{ ${name} };`),
    ts: `${imp} 'react';\n\n${getDec(name, buf)}\n\nexport { ${name} };\n`,
  };
};

/**
 * @param {string} name
 * @param {Buffer} buf
 * @returns {string}
 */
export const getIndexType = (name, buf) => getDec(name, buf);
