import "./tracing.ts"; 
import express from 'express';
import morgan, { TokenIndexer } from 'morgan';
import { api } from './routes.js';
import cors from 'cors';
import pino from 'pino';
import client from 'prom-client';
import { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const logger = pino();
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });
// Create a counter metric for HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});


app.use(cors());
app.use(express.json());
app.use('/api', api);
// Middleware to count each request
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

app.use(
  morgan(function (tokens: TokenIndexer<Request, Response>, req: Request, res: Response): string {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      response_time: tokens['response-time'](req, res) + ' ms',
      date: tokens.date(req, res, 'iso'),
    });
  })
);

app.get('/healthz', (_req, res) => res.send('ok'));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


app.listen(PORT, () => {
  logger.info(`✅ Backend running on http://localhost:${PORT}`);
});
