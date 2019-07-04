import { Command } from 'commander';
import { SWAP_TYPE } from './utils';
import { processSwaps } from './processing/swaps';
import { sweepAllPendingSwaps } from './processing/sweep';

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
  .option('--swap', 'Process all swaps.')
  .option('--sweep', 'Go through all transactions and add any new pending swaps.')
  .parse(process.argv);

if (program.swap) {
  swap();
} else if (program.sweep) {
  sweepAllPendingSwaps();
} else {
  program.help();
}
