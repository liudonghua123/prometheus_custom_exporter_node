import { Gauge } from 'prom-client';

console.info(`Loaded metrics module: custom_metrics_2.js`);

const gauge = new Gauge({ name: 'metric_name_2', help: 'metric_help' });

export default function process(registry) {
    console.info(`Processing metrics module: custom_metrics_2.js`);
    // Register the metric with the provided registry
    registry.registerMetric(gauge);

    // Set initial value or update dynamically
    gauge.set(30); // Set to 20
}
