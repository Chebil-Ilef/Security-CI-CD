import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';


const traceExporter = new OTLPTraceExporter({
    url: 'http://otel-collector:4317',
  });
  
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME || 'backend',
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });
  
  sdk.start();
console.log("✅ OpenTelemetry initialized");