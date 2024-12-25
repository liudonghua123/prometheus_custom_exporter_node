# prometheus_custom_exporter_node

A Node.js-based Prometheus exporter that dynamically loads and serves custom metrics from JavaScript files in a designated directory. The exporter uses the `prom-client` library to collect and serve metrics that can be scraped by Prometheus.

This exporter allows you to add new custom metrics simply by adding or modifying JavaScript files in the `metrics` directory. Each JavaScript file must export a function that registers custom metrics with the Prometheus `Registry`.

## Features

- **Dynamic Metric Loading**: Automatically loads custom metric modules from a specified directory.
- **Custom Metrics Support**: Allows you to define custom metrics using the `prom-client` library.
- **Hot Reloading**: Detects changes in the `metrics` directory and reloads modified/added files automatically.
- **Built-in Metrics**: Optionally exposes default system and Node.js metrics through Prometheus.
- **Lightweight**: Uses Node.js’s built-in HTTP server without additional frameworks like Express.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/liudonghua123/prometheus_custom_exporter_node.git
   cd prometheus_custom_exporter_node
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `metrics` directory and add custom metric files (e.g., `custom_metrics_1.js`).

4. Run the exporter:

   ```bash
   node .
   ```

   The exporter will start an HTTP server on port 3000 (default) that exposes the `/metrics` endpoint. You can change the port by setting the `PORT` environment variable.

## Metrics Directory Structure

- Create a `metrics` directory at the root of the project.
- Each file inside the `metrics` directory should export a function that registers custom metrics to the Prometheus `Registry`. The function will be executed every time the `/metrics` endpoint is accessed.

Example metric module: `metrics/custom_metrics_1.js`

```javascript
import { Gauge } from 'prom-client';

console.info('Loaded metrics module: custom_metrics_1.js');

// Create a custom Gauge metric
const gauge = new Gauge({
  name: 'metric_name_1',
  help: 'Description of your metric'
});

// Export the function that will be called to register the metric
export default function process(registry) {
  // Set the value of the gauge
  gauge.set(10); // Set to 10, or set dynamic values based on your logic
  registry.registerMetric(gauge); // Register the metric with the Prometheus registry
}
```

## How It Works

- The exporter loads all `.js` files from the `metrics` directory at startup.
- Each metric file should export a function that registers custom metrics using the `prom-client` library.
- When the `/metrics` endpoint is accessed, the exporter will call each of these functions and update the custom metrics.
- The `/metrics` endpoint is exposed on the default port `3000` (or the port defined by the `PORT` environment variable).

## Hot Reloading

The exporter watches the `metrics` directory for changes and will automatically reload any new or modified metric files. This allows you to add or modify metrics without restarting the exporter.

## Endpoints

- `/metrics`: Exposes the collected metrics in Prometheus text format.
- `/default-metrics` (optional): Exposes the built-in system and Node.js metrics collected by the `prom-client` library.

## Configuration

- **PORT**: The port on which the exporter will run. Default is `3000`. You can set it using the environment variable:
  
  ```bash
  PORT=8080 node .
  ```

- **metrics directory**: You can change the default `./metrics` directory by modifying the `metricsDir` constant in the code.

## Example Usage

Once the exporter is running, Prometheus can scrape the metrics by adding the following job to your Prometheus configuration (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'custom_exporter'
    static_configs:
      - targets: ['localhost:3000']
```

Then you can access the metrics at `http://localhost:3000/metrics`.

## Contributing

1. Fork the repository.
2. Clone your fork.
3. Create a new branch for your changes.
4. Submit a pull request with a description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
