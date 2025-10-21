import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://otel-collector:4318/v1/traces'
});

export const otel = new NodeSDK({
  traceExporter,
  resource: new (await import('@opentelemetry/resources')).Resource({
    'service.name': process.env.SERVICE_NAME || 'tp2-backend',
    'service.version': process.env.SERVICE_VERSION || '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

export async function startOTEL() {
  await otel.start();
  process.on('SIGTERM', async () => {
    await otel.shutdown();
    process.exit(0);
  });
}
