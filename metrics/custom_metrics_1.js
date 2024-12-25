import { Gauge } from 'prom-client';

console.info(`Loaded metrics module: custom_metrics_1.js`);

const gauge = new Gauge({ name: 'metric_name_1', help: 'metric_help' });

export default function process(registry) {
    // Register the metric with the provided registry
    registry.registerMetric(gauge);

    // Set initial value or update dynamically
    gauge.set(Math.floor(Math.random() * 100)); // Set to a random value between 0 and 99
}
