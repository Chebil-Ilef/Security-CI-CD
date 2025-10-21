import express from 'express';
import pino from 'pino';
import client from 'prom-client';
import { api } from './routes.js';
import { startOTEL } from './otel.js';

async function main() {
    await startOTEL();
  
    const app = express();
    const logger = pino();
    const PORT = process.env.PORT || 3000;
  
    app.use(express.json());
    app.use((req, _res, next) => {
      logger.info({ path: req.path, method: req.method }, 'http_request');
      next();
    });
    app.use('/api', api);
  
    const register = new client.Registry();
    client.collectDefaultMetrics({ register });
  
    const httpCounter = new client.Counter({
      name: 'http_requests_total',
      help: 'Total des requêtes HTTP',
      labelNames: ['method', 'route', 'status'] as const
    });
    register.registerMetric(httpCounter);
  
    app.use((req, res, next) => {
      res.on('finish', () => {
        httpCounter.inc({ method: req.method, route: req.path, status: String(res.statusCode) });
      });
      next();
    });
  
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
  
    app.get('/healthz', (_req, res) => res.send('ok'));
  
    app.listen(PORT, () => logger.info(`✅ Backend started on http://localhost:${PORT}`));
  }
  
  main().catch(console.error);