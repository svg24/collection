import { proc } from './base';
import * as react from './react';
import * as vue from './vue';

async function main() {
  const [, , lib] = process.argv;

  switch (lib) {
    case 'react': {
      await proc([react]);
      break;
    }
    case 'vue': {
      await proc([vue]);
      break;
    }
    default: {
      await proc([react, vue]);
    }
  }
}

main();
