import config from 'config';
import { assert } from 'chai';
import * as infoRoutes from '../../routes/info';
import { wrapRouterFunction } from '../helpers';

const getInfo = params => wrapRouterFunction(infoRoutes.getInfo, params);

describe('Info API', () => {
  describe('#getInfo', () => {
    it('should return the correct fees', async () => {
      const lokiFee = config.get('loki.withdrawalFee');
      const { status, success, result } = await getInfo();
      assert.equal(status, 200);
      assert.isTrue(success);
      assert.isNotNull(result);
      assert.equal(result.fees.loki, lokiFee * 1e9);
    });
  });
});
