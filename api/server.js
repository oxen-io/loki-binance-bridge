import express from 'express';
import { Server } from 'http';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import https from 'https';
import config from 'config';
import routes from './routes';

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
app.use((req, res) => {
  let status = null;
  let body = null;

  switch (res.statusCode) {
    case 205: // Reset Content
      if (res.body) {
        status = res.body.length > 0 ? 200 : 204;
        body = res.body.length > 0 ? res.body : {
          status,
          result: 'No Content',
        };
      } else {
        status = 204;
        body = {
          status,
          result: 'No Content',
        };
      }
      break;
    case 400: // Bad Request
      body = res.body || {
        status: res.statusCode,
        success: false,
        result: 'Bad Request',
      };
      break;
    case 401: // Unauthorized
      body = res.body || {
        status: res.statusCode,
        success: false,
        result: 'Unauthorized',
      };
      break;
    default: break;
  }

  if (status) res.status(status);
  if (body) res.json(body);
});

// Error handler
app.use((err, req, res) => {
  let status = null;
  let body = null;

  if (!err) {
    status = 404;
    body = {
      status,
      result: 'Request not found',
    };
  } else {
    switch (res.statusCode) {
      case 500:
      case 501:
        status = 250;
        body = {
          status,
          result: err,
        };
        break;
      default:
        status = 500;
        body = {
          status,
          result: err.message,
        };
    }
  }

  if (status) res.status(status);
  if (body) res.json(body);
});

https.globalAgent.maxSockets = 50;
app.set('port', config.get('serverPort'));

const server = Server(app);
server.listen(app.get('port'), () => {
  console.log('[Loki Bridge API] Stared server on', server.address().port);
});
