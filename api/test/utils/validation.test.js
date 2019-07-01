/* eslint-disable max-len, arrow-body-style, no-restricted-syntax */
import { assert } from 'chai';
import sinon from 'sinon';
import { validation, SWAP_TYPE } from '../../utils';
import { bnb, loki } from '../../helpers';

const sandbox = sinon.createSandbox();

describe('Validation', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#validateSwap', async () => {
    const stubValidateAddressReturn = value => {
      sandbox.stub(loki, 'validateAddress').returns(value);
      sandbox.stub(bnb, 'validateAddress').returns(value);
    };

    it('should return an error if body is null', async () => {
      const error = await validation.validateSwap(null);
      assert.strictEqual(error, 'invalid params');
    });

    it('should return an error if address is not present', async () => {
      const error = await validation.validateSwap({ type: SWAP_TYPE.LOKI_TO_BLOKI });
      assert.strictEqual(error, 'address is required');
    });

    it('should return an error if type is invalid', async () => {
      const error = await validation.validateSwap({ address: 'an address', type: 'invalid type' });
      assert.strictEqual(error, 'type is invalid');
    });

    it('should return an error if the loki address was invalid', async () => {
      stubValidateAddressReturn(false);

      const error = await validation.validateSwap({ address: 'an address', type: SWAP_TYPE.BLOKI_TO_LOKI });
      assert(loki.validateAddress.calledOnce, 'Loki validate was not called');
      assert.strictEqual(error, 'address must be a LOKI address');
    });

    it('should return an error if the bnb address was invalid', async () => {
      stubValidateAddressReturn(false);
      const error = await validation.validateSwap({ address: 'an address', type: SWAP_TYPE.LOKI_TO_BLOKI });
      assert(bnb.validateAddress.calledOnce, 'BNB validate was not called');
      assert.strictEqual(error, 'address must be a BNB address');
    });

    it('should return null if no errors occurred', async () => {
      stubValidateAddressReturn(true);
      const lokiError = await validation.validateSwap({ address: '1', type: SWAP_TYPE.BLOKI_TO_LOKI });
      assert.isNull(lokiError);
      assert(loki.validateAddress.calledOnce, 'Loki validate was not called');

      const bnbError = await validation.validateSwap({ address: '1', type: SWAP_TYPE.LOKI_TO_BLOKI });
      assert.isNull(bnbError);
      assert(bnb.validateAddress.calledOnce, 'BNB validate was not called');
    });
  });

  describe('#validateUuidPresent', () => {
    it('should return an error if body is null', async () => {
      const error = await validation.validateUuidPresent(null);
      assert.strictEqual(error, 'invalid params');
    });

    it('should return an error if uuid is not present', async () => {
      const error = await validation.validateUuidPresent({});
      assert.strictEqual(error, 'uuid is required');
    });

    it('should not return an error if correct params are present', async () => {
      const error = await validation.validateUuidPresent({ uuid: '1' });
      assert.isNull(error);
    });
  });

  describe('#validateBNBDownloadKeyStore', () => {
    it('should return an error if body is null', async () => {
      const error = await validation.validateBNBDownloadKeyStore(null);
      assert.strictEqual(error, 'invalid params');
    });

    it('should return an error if privateKey is not present', async () => {
      const error = await validation.validateBNBDownloadKeyStore({ password: '123' });
      assert.strictEqual(error, 'privateKey is required');
    });

    it('should return an error if password is not present', async () => {
      const error = await validation.validateBNBDownloadKeyStore({ privateKey: '123' });
      assert.strictEqual(error, 'password is required');
    });

    it('should not return an error if correct params are present', async () => {
      const error = await validation.validateBNBDownloadKeyStore({ privateKey: '1', password: '2' });
      assert.isNull(error);
    });
  });
});
