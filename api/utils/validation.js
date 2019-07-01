import { bnb, loki } from '../helpers';
import { SWAP_TYPE } from './constants';

export async function validateSwap(body) {
  if (!body) return 'invalid params';
  const { type, address } = body;

  if (!address) return 'address is required';
  if (!Object.values(SWAP_TYPE).includes(type)) return 'type is invalid';

  if (type === SWAP_TYPE.BLOKI_TO_LOKI) {
    // User should pass a LOKI address
    const valid = await loki.validateAddress(address);
    if (!valid) return 'address must be a LOKI address';
  } else if (type === SWAP_TYPE.LOKI_TO_BLOKI) {
    // User should pass a BNB address
    if (!bnb.validateAddress(address)) return 'address must be a BNB address';
  }

  return null;
}

export function validateFinalizeSwap(body) {
  if (!body) return 'invalid params';
  const { uuid } = body;
  if (!uuid) return 'uuid is required';
  return null;
}

export function validateBNBDownloadKeyStore(body) {
  if (!body) return 'invalid params';
  const { password, privateKey } = body;

  if (!privateKey) return 'privateKey is required';
  if (!password) return 'password is required';

  return null;
}
