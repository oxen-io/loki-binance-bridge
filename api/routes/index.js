import { Router } from 'express';
import bodyParser from 'body-parser';
import * as swap from './swap';
import * as info from './info';

const router = Router();

router.get('/api/v1/getInfo', bodyParser.json(), info.getInfo);

router.get('/api/v1/getUncomfirmedLokiTransactions', bodyParser.json(), swap.getUncomfirmedLokiTransactions);
router.get('/api/v1/getSwaps', bodyParser.json(), swap.getSwaps);
router.post('/api/v1/swap', bodyParser.json(), swap.swapToken);
router.post('/api/v1/finalizeSwap', bodyParser.json(), swap.finalizeSwap);

export default router;
