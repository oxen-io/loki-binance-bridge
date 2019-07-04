
import crypto from 'crypto';
import sha256 from 'sha256';
import * as bip39 from 'bip39';

export function encrypt(data, url) {
  const signJson = JSON.stringify(data);
  const signMnemonic = bip39.generateMnemonic();
  const cipher = crypto.createCipher('aes-256-cbc', signMnemonic);
  const signEncrypted =
    cipher.update(signJson, 'utf8', 'base64') + cipher.final('base64');

  let signData = {
    e: toHex(signEncrypted),
    m: toHex(signMnemonic),
    u: sha256(url).toUpperCase(),
    p: sha256(sha256(url).toUpperCase()).toUpperCase(),
    t: new Date().getTime()
  };

  const signSeed = JSON.stringify(signData);
  const signSignature = sha256(signSeed);
  signData.s = signSignature;

  return signData;
}

function toHex(str) {
  let result = '';
  for (let i = 0; i < str.length; i += 1) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}
