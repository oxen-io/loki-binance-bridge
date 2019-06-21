import { Router } from 'express';
import bodyParser from 'body-parser';
import * as models from '../models';

const router = Router();

router.post('/api/v1/swap', bodyParser.json(), models.swapToken);
router.post('/api/v1/finalizeSwap', bodyParser.json(), models.finalizeSwap);

router.post('/api/v1/createBNBAccount', bodyParser.json(), models.createBNBAccount);
router.post('/api/v1/downloadBNBKeystore', bodyParser.json(), models.downloadBNBKeystore);

export default router;
