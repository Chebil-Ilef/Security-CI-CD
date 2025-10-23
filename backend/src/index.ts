import "./tracing.js"; 
import express from 'express';
import morgan, { TokenIndexer } from 'morgan';
import { api } from './routes.js';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import client from 'prom-client';
import { Request, Response } from 'express';

const app = express();
// --- Security Middleware ---
app.disable('x-powered-by'); // removes the header leak

// Apply Helmet to set secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // adjust if using inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Add Permissions Policy header manually
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Add cache control headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


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


app.use(cors({ origin: ['http://localhost:5173'] })); 
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

app.get('/', (_req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0.0',
    endpoints: {
      health: '/healthz',
      metrics: '/metrics',
      tasks: '/api/tasks'
    }
  });
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /api/\nAllow: /healthz\nAllow: /metrics');
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
});

app.get('/healthz', (_req, res) => res.send('ok'));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


app.post("/api/insecure", (req, res) => {
  eval(req.body.input); // on purpose insecure
  res.send("ok");
});


app.listen(PORT, () => {
  logger.info(`✅ Backend running on http://localhost:${PORT}`);
});
