import { Command } from 'commander';
import { SWAP_TYPE } from './utils';
import { processSwaps } from './processing/swaps';

const swapTypes = Object.values(SWAP_TYPE);
const swapTypesString = swapTypes.join(', ');

const program = new Command();

const swap = async () => {
  await processSwaps(SWAP_TYPE.LOKI_TO_BLOKI);
  await processSwaps(SWAP_TYPE.BLOKI_TO_LOKI);
};

program
  .description('Perform processing')
  .option('-s, --swap', 'Process all swaps.')
  .parse(process.argv);

if (program.swap) {
  console.info('Processing swaps');
  swap();
} else {
  program.help();
}
