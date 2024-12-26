#!/usr/bin/env -S node --env-file=.env --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * Prometheus Custom Exporter with Dynamic Metrics Refresh
 *
 * This script dynamically loads custom Prometheus metrics from the `metrics` directory,
 * watches for changes, and ensures metrics are refreshed on every request to `/metrics`.
 */

import { createServer } from 'http';
import { readdir } from 'fs/promises';
import { watch } from 'fs/promises';
import { resolve, extname } from 'path';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { pathToFileURL } from 'url';

// Configuration
const PORT = process.env.PORT || 3000;
const serverStartTime = Date.now();
const metricsDir = resolve('./metrics');

// Create a custom Prometheus registry
const customRegistry = new Registry();

// Optionally collect default system metrics in a separate registry (if needed)
const defaultRegistry = new Registry();
collectDefaultMetrics({ register: defaultRegistry });

// Map to store `process` functions from metrics modules
const metricsProcessors = new Map();

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
            metricsProcessors.set(filePath, module.default); // Store the `process` function
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
            // Evaluate all stored `process` functions to update metrics dynamically
            for (const processor of metricsProcessors.values()) {
                await processor(customRegistry);
            }

            const metrics = await customRegistry.metrics(); // Fetch all custom registered metrics
            res.setHeader('Content-Type', customRegistry.contentType); // Set content type for Prometheus
            res.end(metrics); // Respond with metrics data
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
            res.statusCode = 500; // Internal Server Error
            res.end('Internal Server Error');
        }
    }
    else if (req.url === '/default-metrics') {
      try {
          const metrics = await defaultRegistry.metrics();
          res.setHeader('Content-Type', defaultRegistry.contentType);
          res.end(metrics);
      } catch (err) {
          console.error('Failed to fetch default metrics:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
      }
  }
   else {
        res.end(`Server started at ${serverStartTime}, uptime: ${Date.now() - serverStartTime}ms`);
    }
}).listen(PORT, () => {
    console.log(`Prometheus exporter running at http://localhost:${PORT}/metrics`);
});
