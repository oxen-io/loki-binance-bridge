import { Router } from 'express';
import bodyParser from 'body-parser';
import * as swap from './swap';

const router = Router();

router.get('/api/v1/getWithdrawalFees', bodyParser.json(), swap.getWithdrawalFees);
router.get('/api/v1/getSwaps', bodyParser.json(), swap.getSwaps);
router.post('/api/v1/swap', bodyParser.json(), swap.swapToken);
router.post('/api/v1/finalizeSwap', bodyParser.json(), swap.finalizeSwap);

export default router;
