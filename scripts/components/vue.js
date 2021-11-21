import { compile } from '@vue/compiler-dom';

/**
 * @type {string}
 */
export const output = './packages/vue';

/**
 * @param {string} name
 * @param {string} preview
 * @returns {string}
 */
export const getType = (name, preview) => (
  `/**
 * ${preview}
 */
declare const ${name}: RenderFunction;`
);

/**
 * @param {string} name
 * @param {string} content
 * @param {string} preview
 * @returns {Promise<{ cjs: string, js: string, ts: string }>}
 */
export const getCode = async (name, content, preview) => {
  const { code } = compile(content, {
    mode: 'module',
  });

  return {
    cjs: code.replace(
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+(['"])(.*?)\2/,
      (_, imports, __, mod) => {
        const newImports = imports
          .split(',')
          .map((i) => i.trim().replace(/\s+as\s+/, ': '))
          .join(', ');

        return `const { ${newImports} } = require("${mod}")`;
      },
    ),
    js: code,
    ts: `import { RenderFunction } from 'vue';\n\n${
      getType(name, preview)
    }\n\nexport { ${name} };\n`,
  };
};
