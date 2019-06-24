import express from 'express';
import { Server } from 'http';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import https from 'https';
import config from 'config';
import routes from './routes';
import { loki } from './helpers';

const app = express();
app.all('/*', (req, res, next) => {
  // CORS headers
  res.set('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization,Username,Password,Signature,X-Access-Token,X-Key')
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

app.use('/', routes);

// Data handler
app.use((req, res, next) => {
  if (res.statusCode === 205) {
    if (res.body) {
      if (res.body.length === 0) {
        res.status(204);
        res.json({
          status: 204,
          result: 'No Content',
        });
      } else {
        res.status(200);
        res.json(res.body);
      }
    } else {
      res.status(204);
      res.json({
        status: 204,
        result: 'No Content',
      });
    }
  } else if (res.statusCode === 400) {
    res.status(res.statusCode);
    if (res.body) {
      res.json(res.body);
    } else {
      res.json({
        status: res.statusCode,
        success: false,
        result: 'Bad Request',
      });
    }
  } else if (res.statusCode === 401) {
    res.status(res.statusCode);
    if (res.body) {
      res.json(res.body);
    } else {
      res.json({
        status: res.statusCode,
        success: false,
        result: 'Unauthorized',
      });
    }
  } else if (res.statusCode) {
    res.status(res.statusCode);
    res.json(res.body);
  } else {
    res.status(200);
    res.json(res.body);
  }
});

app.use((err, req, res, next) => {
  if (err) {
    if (res.statusCode === 500 || req.statusCode === 501) {
      res.status(250);
      res.json({
        status: 250,
        result: err,
      });
    } else {
      res.status(500);
      res.json({
        status: 500,
        result: err.message,
      });
    }
  } else {
    res.status(404);
    res.json({
      status: 404,
      result: 'Request not found',
    });
  }
});

https.globalAgent.maxSockets = 50;
app.set('port', config.get('serverPort'));

const walletConfig = config.get('loki.wallet');
loki.openWallet(walletConfig.filename, walletConfig.password).then(() => {
  const server = Server(app);
  server.listen(app.get('port'), () => {
    console.log('[Loki Bridge API] Stared server on', server.address().port);
  });
}).catch(error => {
  console.log(`Failed to open Loki Wallet - ${error.message}`);
});
