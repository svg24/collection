import babel from '@babel/core';
import reactJSX from '@babel/plugin-transform-react-jsx';
import svgr from '@svgr/core';

const OUTPUT = './packages/react';

/**
 * @param {string} name
 * @returns {string}
 */
const getDec = (name) => (
  `declare function ${name}(props: React.ComponentProps<'svg'>): JSX.Element;`
);

/**
 * @type {string}
 */
export const output = OUTPUT;

/**
 * @param {string} name
 * @param {string} content
 * @returns {Promise<{ cjs: string, js: string, ts: string }>}
 */
export const getCode = async (name, content) => {
  const component = await svgr.default(content, {}, { componentName: name });
  const { code } = await babel.transformAsync(component, {
    plugins: [[reactJSX, { useBuiltIns: true }]],
  });
  const imp = 'import * as React from';

  return {
    cjs: code
      .replace(`${imp} "react";`, 'const React = require(\'react\');')
      .replace('export default', `exports.${name} =`),
    js: code.replace(`default ${name};`, `{ ${name} };`),
    ts: `${imp} 'react';\n\n${getDec(name)}\n\nexport { ${name} };\n`,
  };
};

/**
 * @param {string} name
 * @returns {string}
 */
export const getIndexType = (name) => getDec(name);
