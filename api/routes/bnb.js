/* eslint-disable no-extend-native */
import { bnb } from '../helpers';
import { crypto, validation } from '../utils';

/**
 * Create a BNB wallet.
 * This method is for creating a wallet from the frontend.
 */
export function createBNBAccount(req, res, next) {
  const account = bnb.createAccountWithMnemonic();

  res.status(205);
  res.body = { status: 200, success: true, result: account };
  return next(null, req, res, next);
}

/**
 * Download the keystore for the given BNB account
 * Request Data:
 *  - password: A password
 *  - privateKey: The BNB account private key
 */
export function downloadBNBKeystore(req, res, next) {
  crypto.decryptAPIPayload(req, res, next, data => {
    const result = validation.validateBNBDownloadKeyStore(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { password, privateKey } = data;
    const account = bnb.generateKeyStore(privateKey, password);

    const resData = JSON.stringify(account);
    res.setHeader('Content-disposition', `attachment; filename=${account.id}_keystore.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(resData);
    return null;
  });
}
