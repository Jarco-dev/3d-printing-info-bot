import type { GCStatistics, GCStatsEventEmitter } from "@sematext/gc-stats";
import type Client from "../index";
import type { Express } from "express";
import gcStats from "@sematext/gc-stats";
import express from "express";
import PromClient from "prom-client";

class MetricsManager {
    public port: number;
    public metrics: { [key: string]: any };
    public lastCpuUsage: NodeJS.CpuUsage;
    public memoryUsage: NodeJS.MemoryUsage;
    public promClient: typeof PromClient;
    public app: Express;
    private gcStats: GCStatsEventEmitter;
    private client: typeof Client;
    private logger: typeof Client.logger;

    constructor(client: typeof Client) {
        this.client = client;
        this.logger = client.logger;
        this.port = client.sConfig.METRICS_PORT;
        this.metrics = {};
        this.lastCpuUsage = process.cpuUsage();
        this.memoryUsage = process.memoryUsage();
        this.promClient = PromClient;
        this.gcStats = gcStats();

        this._createMetrics();
        this._createListeners();

        this.app = express();
        this.app.get("/metrics", async (req, res): Promise<void> => {
            try {
                this.memoryUsage = process.memoryUsage();
                res.set("Content-Type", this.promClient.register.contentType);
                res.end(await this.promClient.register.metrics());
            } catch (err) {
                this.logger.error("Error while handling metrics request", err);
                res.status(500).end();
            }
        });
    }

    public start(): void {
        this.app.listen(this.port, (): void => {
            this.logger.verbose(
                `Prometheus metrics exposed on port ${this.port}`
            );
        });
    }

    private _createMetrics(): void {
        // process
        this.metrics.processCpuSeconds = new this.promClient.Counter({
            name: "process_cpu_seconds_total",
            help: "Total user and system CPU time spent in seconds",
            collect: () => {
                const cpuUsage = process.cpuUsage();
                const cpuSeconds =
                    (cpuUsage.system +
                        cpuUsage.user -
                        (this.lastCpuUsage.user + this.lastCpuUsage.system)) /
                    1e6;
                this.lastCpuUsage = cpuUsage;
                this.metrics.processCpuSeconds.inc(cpuSeconds);
            }
        });

        // nodejs
        this.metrics.eventLoopLag = new this.promClient.Gauge({
            name: "nodejs_eventloop_lag_seconds",
            help: "Lag of event loop in seconds",
            aggregator: "average",
            collect: () => {
                const start = process.hrtime();
                setImmediate(() => {
                    const delta = process.hrtime(start);
                    const seconds = (delta[0] * 1e9 + delta[1]) / 1e9;
                    this.metrics.eventLoopLag.set(seconds);
                });
            }
        });

        this.metrics.residentSetSizeBytes = new this.promClient.Gauge({
            name: "nodejs_resident_set_size_bytes",
            help: "The resident set size in bytes",
            collect: () => {
                this.metrics.residentSetSizeBytes.set(this.memoryUsage.rss);
            }
        });

        this.metrics.heapSizeUsedBytes = new this.promClient.Gauge({
            name: "nodejs_heap_size_used_bytes",
            help: "The heap size used in bytes",
            collect: () => {
                this.metrics.heapSizeUsedBytes.set(this.memoryUsage.heapUsed);
            }
        });

        this.metrics.heapSizeTotalBytes = new this.promClient.Gauge({
            name: "nodejs_heap_size_total_bytes",
            help: "The heap size total in bytes",
            collect: () => {
                this.metrics.heapSizeTotalBytes.set(this.memoryUsage.heapTotal);
            }
        });

        this.metrics.externalBytes = new this.promClient.Gauge({
            name: "nodejs_external_memory_bytes",
            help: "The external memory in bytes",
            collect: () => {
                this.metrics.externalBytes.set(this.memoryUsage.external);
            }
        });

        this.metrics.gcCount = new this.promClient.Counter({
            name: "nodejs_gc_runs_total",
            help: "Count of total garbage collection runs",
            labelNames: ["gcType"]
        });

        this.metrics.gcTimeCount = new this.promClient.Counter({
            name: "nodejs_gc_pause_seconds_total",
            help: "Time spent in GC Pause in seconds.",
            labelNames: ["gcType"]
        });

        this.metrics.gcReclaimedCount = new this.promClient.Counter({
            name: "nodejs_gc_reclaimed_bytes_total",
            help: "Total number of bytes reclaimed by GC.",
            labelNames: ["gcType"]
        });

        // bot
        this.metrics.clientUptime = new this.promClient.Gauge({
            name: "bot_client_uptime",
            help: "The time passed in ms since the Discord.Client logged in",
            collect: () => {
                this.metrics.clientUptime.set(this.client.uptime);
            }
        });

        this.metrics.websocketLatency = new this.promClient.Gauge({
            name: "bot_websocket_latency",
            help: "The latency between the bots websocket and the discord api server",
            collect: () => {
                this.metrics.websocketLatency.set(this.client.ws.ping);
            }
        });

        this.metrics.websocketEvents = new this.promClient.Counter({
            name: "bot_websocket_events_total",
            help: "The total amount of events received from the discord api",
            labelNames: ["event"]
        });

        this.metrics.commandsExecuted = new this.promClient.Counter({
            name: "bot_commands_executed_total",
            help: "The total amount of commands that have been executed by users",
            labelNames: ["name"]
        });

        this.metrics.buttonsExecuted = new this.promClient.Counter({
            name: "bot_buttons_executed_total",
            help: "The total amount of buttons and menus that have been executed by users",
            labelNames: ["customId"]
        });

        this.metrics.menusExecuted = new this.promClient.Counter({
            name: "bot_menus_executed_total",
            help: "The total amount of buttons and menus that have been executed by users",
            labelNames: ["customId"]
        });

        this.metrics.clientCacheSize = new this.promClient.Gauge({
            name: "bot_client_cache_size",
            help: "The Discord.Client's cache sizes",
            labelNames: ["type"],
            collect: () => {
                this.metrics.clientCacheSize
                    .labels("users")
                    .set(this.client.users.cache.size ?? 0);
                this.metrics.clientCacheSize
                    .labels("channels")
                    .set(this.client.channels.cache.size ?? 0);
                this.metrics.clientCacheSize
                    .labels("guilds")
                    .set(this.client.guilds.cache.size ?? 0);
                this.metrics.clientCacheSize
                    .labels("members")
                    .set(
                        this.client.guilds.cache.reduce(
                            (a, g) => g.members.cache.size,
                            0
                        )
                    );
                this.metrics.clientCacheSize
                    .labels("messages")
                    .set(
                        this.client.channels.cache.reduce(
                            (a, c) =>
                                "messages" in c ? c.messages.cache.size : 0,
                            0
                        )
                    );
            }
        });
    }

    private _createListeners(): void {
        // Garbage collector stats
        const gcTypes: { [key: number]: string } = {
            1: "Scavenge",
            2: "MarkSweepCompact",
            4: "IncrementalMarking",
            8: "WeakPhantom",
            15: "Other"
        };
        this.gcStats.on("stats", (stats: GCStatistics) => {
            const gcType = gcTypes[stats.gctype];
            this.metrics.gcCount.labels(gcType).inc();
            this.metrics.gcTimeCount.labels(gcType).inc(stats.pause / 1e9);
            if (stats.diff.usedHeapSize < 0) {
                this.metrics.gcReclaimedCount
                    .labels(gcType)
                    .inc(stats.diff.usedHeapSize * -1);
            }
        });

        // Websocket events
        this.client.on("raw", p => {
            this.metrics.websocketEvents.labels(p.t ?? "UNKNOWN").inc();
        });

        // Commands, buttons and menus executed total
        this.client.on("interactionCreate", i => {
            if (i.isCommand())
                this.metrics.commandsExecuted.labels(i.commandName).inc();
            else if (i.isButton())
                this.metrics.buttonsExecuted.labels(i.customId).inc();
            else if (i.isStringSelectMenu())
                this.metrics.menusExecuted.labels(i.customId).inc();
        });
    }
}

export default MetricsManager;
