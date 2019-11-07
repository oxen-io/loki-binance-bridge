/* eslint-disable import/prefer-default-export */
import config from 'config';

export function getInfo(req, res, next) {
  const lokiFee = config.get('loki.withdrawalFee');
  const lokiAmount = (parseFloat(lokiFee) * 1e9).toFixed(0);

  const info = { fees: { loki: lokiAmount } };

  res.status(205);
  res.body = {
    status: 200,
    success: true,
    result: info,
  };
  return next(null, req, res, next);
}
