import { proc } from './base';
import * as react from './react';
import * as vue from './vue';

async function main() {
  const [, , lib, ...dirs] = process.argv;

  if (!dirs.length) {
    throw new Error('Please specify a directories');
  }

  switch (lib) {
    case 'react': {
      await proc(dirs, [react]);
      break;
    }
    case 'vue': {
      await proc(dirs, [vue]);
      break;
    }
    default: {
      await proc(dirs, [react, vue]);
    }
  }
}

main();
