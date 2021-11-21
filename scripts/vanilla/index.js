import { process as post } from './post';
import { process as pre } from './pre';

async function main() {
  const [, , mode, ...dirs] = process.argv;

  switch (mode) {
    case 'pre': {
      await pre(dirs);
      break;
    }
    case 'post': {
      await post(dirs);
      break;
    }
    default: {
      throw new Error('Please specify a mod (pre, post)');
    }
  }
}

main();
