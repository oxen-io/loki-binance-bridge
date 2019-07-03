import { Command } from 'commander';
import { SWAP_TYPE } from './utils';
import { processSwaps } from './processing/swaps';

const program = new Command();

const swap = async () => {
  console.info(`Processing swaps for ${SWAP_TYPE.LOKI_TO_BLOKI}`);
  await processSwaps(SWAP_TYPE.LOKI_TO_BLOKI);
  console.info();

  console.info(`Processing swaps for ${SWAP_TYPE.BLOKI_TO_LOKI}`);
  await processSwaps(SWAP_TYPE.BLOKI_TO_LOKI);
};

program
  .description('Perform processing')
  .option('-s, --swap', 'Process all swaps.')
  .parse(process.argv);

if (program.swap) {
  swap();
} else {
  program.help();
}
