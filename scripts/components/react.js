import babel from '@babel/core';
import reactJSX from '@babel/plugin-transform-react-jsx';
import svgr from '@svgr/core';

/**
 * @type {string}
 */
export const output = './packages/react';

/**
 * @param {string} name
 * @param {string} content
 * @param {string} preview
 * @returns {Promise<{ cjs: string, js: string, ts: string }>}
 */
export const getCode = async (name, content, preview) => {
  const component = await svgr.default(content, {
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
    ts: `${imp} 'react';\n\n`
      + `${preview}export declare function ${name}(`
      + 'props: React.ComponentProps<\'svg\'>,'
      + ' svgRef: React.ForwardedRef<SVGElement>'
      + '): JSX.Element;',
  };
};
