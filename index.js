#!/usr/bin/env -S node --env-file=.env --experimental-strip-types --no-warnings=ExperimentalWarning
/**
 * Prometheus Custom Exporter with Cached Metrics
 *
 * Dynamically loads custom Prometheus metrics, watches for changes, and caches metrics
 * for faster response times. Metrics are refreshed every 10 seconds.
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

// Cache for metrics
let cachedMetrics = '';
let lastUpdated = 0;

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

/**
 * Refreshes cached metrics.
 */
async function refreshMetricsCache() {
    try {
        for (const processor of metricsProcessors.values()) {
            await processor(customRegistry); // Update custom metrics
        }
        cachedMetrics = await customRegistry.metrics(); // Cache the metrics
        lastUpdated = Date.now();
    } catch (err) {
        console.error('Failed to refresh metrics cache:', err);
    }
}

// Start the process: load all metrics, set up directory watching, and start cache refresh
loadAllMetrics().catch(console.error);
watchMetricsDir().catch(console.error);
refreshMetricsCache(); // Initial cache refresh
setInterval(refreshMetricsCache, 10000); // Refresh metrics cache every 10 seconds

// Create and start the HTTP server
createServer(async (req, res) => {
    try {
        if (req.url === '/metrics') {
            res.setHeader('Content-Type', customRegistry.contentType);
            res.end(cachedMetrics); // Serve cached metrics
        } else if (req.url === '/default-metrics') {
            const metrics = await defaultRegistry.metrics();
            res.setHeader('Content-Type', defaultRegistry.contentType);
            res.end(metrics);
        } else {
            res.end(`Server started at ${serverStartTime}, uptime: ${Date.now() - serverStartTime}ms`);
        }
    } catch (err) {
        console.error('Error processing request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
}).listen(PORT, () => {
    console.log(`Prometheus exporter running at http://localhost:${PORT}/metrics`);
});
