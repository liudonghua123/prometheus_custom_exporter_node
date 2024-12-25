# prometheus_custom_exporter_node

一个基于 Node.js 的 Prometheus Exporter，用于动态加载并提供自定义指标。该 Exporter 使用 `prom-client` 库收集和提供可以被 Prometheus 抓取的指标。

此 Exporter 允许您通过简单地添加或修改 `metrics` 目录中的 JavaScript 文件来添加新的自定义指标。每个 JavaScript 文件必须导出一个函数，该函数会将自定义指标注册到 Prometheus 的 `Registry` 中。

## 特性

- **动态加载指标**：自动加载指定目录中的自定义指标模块。
- **支持自定义指标**：允许使用 `prom-client` 库定义自定义指标。
- **热重载**：检测 `metrics` 目录中的变化，自动重新加载修改或添加的文件。
- **内置指标**：可选地通过 Prometheus 暴露默认的系统和 Node.js 指标。
- **轻量级**：使用 Node.js 内置的 HTTP 服务器，无需额外的框架如 Express。

## 安装

1. 克隆仓库：

   ```bash
   git clone https://github.com/liudonghua123/prometheus_custom_exporter_node.git
   cd prometheus_custom_exporter_node
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 创建一个 `metrics` 目录并添加自定义指标文件（例如：`custom_metrics_1.js`）。

4. 启动 Exporter：

   ```bash
   node .
   ```

   Exporter 将在默认端口 3000 上启动 HTTP 服务器，并暴露 `/metrics` 端点。您可以通过设置 `PORT` 环境变量来更改端口。

## 指标目录结构

- 在项目根目录下创建 `metrics` 目录。
- `metrics` 目录中的每个文件都应该导出一个函数，该函数会将自定义指标注册到 Prometheus 的 `Registry` 中。每次访问 `/metrics` 端点时，都会执行此函数。

示例指标模块：`metrics/custom_metrics_1.js`

```javascript
import { Gauge } from 'prom-client';

console.info('Loaded metrics module: custom_metrics_1.js');

// 创建自定义 Gauge 指标
const gauge = new Gauge({
  name: 'metric_name_1',
  help: 'Description of your metric'
});

// 导出注册指标的函数
export default function process(registry) {
  // 设置指标的值
  gauge.set(10); // 设置为 10，或根据您的逻辑设置动态值
  registry.registerMetric(gauge); // 将指标注册到 Prometheus 的 Registry
}
```

## 工作原理

- 在启动时，Exporter 会加载 `metrics` 目录中的所有 `.js` 文件。
- 每个指标文件应导出一个函数，该函数会使用 `prom-client` 库注册自定义指标。
- 当访问 `/metrics` 端点时，Exporter 会调用这些函数并更新自定义指标。
- 默认情况下，Exporter 会在端口 3000 上暴露 `/metrics` 端点（也可以通过 `PORT` 环境变量更改端口）。

## 热重载

Exporter 会监控 `metrics` 目录的变化，自动重新加载任何新增或修改的指标文件。这允许您在不重新启动 Exporter 的情况下添加或修改指标。

## 端点

- `/metrics`：以 Prometheus 文本格式暴露收集到的指标。
- `/default-metrics`（可选）：暴露由 `prom-client` 库收集的内置系统和 Node.js 指标。

## 配置

- **PORT**：Exporter 运行的端口，默认是 `3000`。您可以通过环境变量来设置端口：
  
  ```bash
  PORT=8080 node .
  ```

- **指标目录**：您可以通过修改代码中的 `metricsDir` 常量来更改默认的 `./metrics` 目录。

## 示例用法

启动 Exporter 后，您可以通过将以下配置添加到 Prometheus 的配置文件（`prometheus.yml`）中来抓取指标：

```yaml
scrape_configs:
  - job_name: 'custom_exporter'
    static_configs:
      - targets: ['localhost:3000']
```

然后，您可以通过访问 `http://localhost:3000/metrics` 获取指标。

## 贡献

1. Fork 该仓库。
2. 克隆您的 Fork。
3. 创建一个新的分支进行更改。
4. 提交一个包含更改描述的 Pull Request。

## 许可证

该项目使用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。
