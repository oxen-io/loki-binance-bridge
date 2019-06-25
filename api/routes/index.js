import { Router } from 'express';
import bodyParser from 'body-parser';
import * as swap from './swap';
import * as bnb from './bnb';

const router = Router();

router.post('/api/v1/swap', bodyParser.json(), swap.swapToken);
router.post('/api/v1/finalizeSwap', bodyParser.json(), swap.finalizeSwap);

router.post('/api/v1/createBNBAccount', bodyParser.json(), bnb.createBNBAccount);
router.post('/api/v1/downloadBNBKeystore', bodyParser.json(), bnb.downloadBNBKeystore);

export default router;
