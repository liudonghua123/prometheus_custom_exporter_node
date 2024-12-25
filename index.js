/**
 * Prometheus Custom Exporter
 * 
 * This script dynamically loads custom Prometheus metrics from the `metrics` directory,
 * watches for changes, and serves the metrics via an HTTP server.
 */

import { createServer } from 'http'; // Built-in HTTP server module
import { readdir } from 'fs/promises'; // Promises API for reading directories
import { watch } from 'fs/promises'; // Promises API for watching file system changes
import { resolve, extname } from 'path'; // Utilities for handling file paths
import { collectDefaultMetrics, Registry } from 'prom-client'; // Prometheus client library
import { pathToFileURL } from 'url'; // Convert file paths to URL format

// Configuration
const PORT = process.env.PORT || 3000; // HTTP server port
const serverStartTime = Date.now(); // Record server start time for uptime metric
const metricsDir = resolve('./metrics'); // Directory containing custom metrics modules

// Create a Prometheus registry and collect default system metrics
const registry = new Registry();
collectDefaultMetrics({ register: registry });

/**
 * Dynamically loads a metrics module.
 *
 * @param {string} filePath - Path to the metrics module file.
 * @returns {Promise<void>} - Resolves when the module is loaded or logs errors.
 */
async function loadMetricsModule(filePath) {
    if (!extname(filePath).endsWith('.js')) return; // Skip non-JS files

    try {
        const moduleUrl = pathToFileURL(filePath).href; // Convert file path to URL
        const module = await import(moduleUrl); // Dynamically import the module

        if (typeof module.default === 'function') {
            module.default(registry); // Call the module's default export with the registry
            console.log(`Loaded metrics module: ${filePath}`);
        } else {
            console.error(`Invalid metrics module format: ${filePath}`);
        }
    } catch (err) {
        console.error(`Failed to load metrics module: ${filePath}`, err);
    }
}

/**
 * Loads all metrics modules at server startup.
 *
 * @returns {Promise<void>} - Resolves when all modules are loaded or logs errors.
 */
async function loadAllMetrics() {
    try {
        const files = await readdir(metricsDir); // Read all files in the metrics directory
        for (const file of files) {
            const filePath = resolve(metricsDir, file); // Resolve full file path
            await loadMetricsModule(filePath); // Load each module
        }
    } catch (err) {
        console.error('Failed to load metrics during initialization:', err);
    }
}

/**
 * Watches the metrics directory for changes and dynamically reloads modules.
 *
 * @returns {Promise<void>} - Resolves when watching is set up or logs errors.
 */
async function watchMetricsDir() {
    for await (const event of watch(metricsDir, { recursive: false })) {
        const filePath = resolve(metricsDir, event.filename); // Resolve full file path
        if (event.eventType === 'change' || event.eventType === 'rename') {
            await loadMetricsModule(filePath); // Reload module on changes or renames
        }
    }
}

// Start the process: load all metrics and set up directory watching
loadAllMetrics().catch(console.error);
watchMetricsDir().catch(console.error);

// Create and start the HTTP server
createServer(async (req, res) => {
    if (req.url === '/metrics') {
        try {
            const metrics = await registry.metrics(); // Fetch all registered metrics
            res.setHeader('Content-Type', registry.contentType); // Set content type for Prometheus
            res.end(metrics); // Respond with metrics data
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
            res.statusCode = 500; // Internal Server Error
            res.end('Internal Server Error');
        }
    } else {
        res.end(`Server started at ${serverStartTime}, uptime: ${Date.now() - serverStartTime}ms`);
    }
}).listen(PORT, () => {
    console.log(`Prometheus exporter running at http://localhost:${PORT}/metrics`);
});
