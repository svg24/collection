import { proc } from './base';
import * as react from './react';

async function main() {
  const [, , lib, ...dirs] = process.argv;

  switch (lib) {
    case 'react': {
      await proc(dirs, [react]);
      break;
    }
    default: {
      await proc(dirs, [react]);
    }
  }
}

main();
