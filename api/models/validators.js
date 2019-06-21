import bnb from '../helpers/bnb';
import { SWAP_TYPE } from './constants';

export function validateSwap(body) {
  const { type, address } = body;

  if (!address) return 'address is required';
  if (!Object.values(SWAP_TYPE).includes(type)) return 'type is invalid';
  if (type === SWAP_TYPE.BNB_TO_LOKI && !bnb.validateAddress(address)) return 'BNB address is invalid';

  return null;
}

export function validateBNBDownloadKeyStore(body) {
  const { password, privateKey } = body;

  if (!privateKey) return 'privateKey is required';
  if (!password) return 'password is required';

  return null;
}
