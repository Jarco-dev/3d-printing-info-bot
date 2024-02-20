import moment from "moment";
import fs from "fs";
import path from "path";
import { LogLevel } from "@/types";

export class Logger {
    private readonly level: 0 | 1 | 2 | 3 | 4;
    private readonly levelConfigs = {
        0: {
            name: "VERBOSE",
            color: "\x1b[37m", // white
            embedColor: 0xffffff
        },
        1: {
            name: "DEBUG",
            color: "\x1b[36m", // cyan
            embedColor: 0x00ffff
        },
        2: {
            name: "INFO",
            color: "\x1b[32m", // green
            embedColor: 0x00ff00
        },
        3: {
            name: "WARN",
            color: "\x1b[33m", // yellow
            embedColor: 0xffff00
        },
        4: {
            name: "ERROR",
            color: "\x1b[31m", // red
            embedColor: 0xff0000
        }
    };

    private combinedLogFile: fs.WriteStream;
    private errorLogFile: fs.WriteStream;

    constructor(level: LogLevel) {
        // Set log level and level index
        switch (level) {
            case "VERBOSE":
                this.level = 0;
                break;

            case "DEBUG":
                this.level = 1;
                break;

            case "INFO":
                this.level = 2;
                break;

            case "WARN":
                this.level = 3;
                break;

            case "ERROR":
                this.level = 4;
                break;

            default: {
                this.level = 2;
                console.warn(
                    ...this.formatLog("CONSOLE", 3, [
                        `${level} is a invalid LogLevel, defaulting to INFO`
                    ])
                );
                break;
            }
        }

        // Create streams
        const dir = path.join(process.cwd(), "storage", "logs");
        this.combinedLogFile = this.createWriteStream(dir, "combined.log");
        this.errorLogFile = this.createWriteStream(dir, "error.log");
    }

    public verbose(...args: unknown[]): void {
        if (this.level <= 0) {
            this.processLog(0, args);
        }
    }

    public debug(...args: unknown[]): void {
        if (this.level <= 1) {
            this.processLog(1, args);
        }
    }

    public info(...args: unknown[]): void {
        if (this.level <= 2) {
            this.processLog(2, args);
        }
    }

    public warn(...args: unknown[]): void {
        if (this.level <= 3) {
            this.processLog(3, args);
        }
    }

    public error(...args: unknown[]): void {
        if (this.level <= 4) {
            this.processLog(4, args);
        }
    }

    private processLog(level: 0 | 1 | 2 | 3 | 4, logs: unknown[]): void {
        console.log(...this.formatLog("CONSOLE", level, logs));
        this.combinedLogFile.write(this.formatLog("FILE", level, logs));

        if (level === 4) {
            this.errorLogFile.write(this.formatLog("FILE", level, logs));
        }
    }

    private createWriteStream(dir: string, file: string): fs.WriteStream {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filePath = path.resolve(path.join(dir, file));
        if (!filePath) fs.writeFileSync(filePath, "");

        const writeStream = fs.createWriteStream(filePath, {
            flags: "a",
            encoding: "utf8"
        });
        writeStream.on("error", err => {
            console.error(
                ...this.formatLog("CONSOLE", 4, [
                    `Error while writing log to ${file}`,
                    err
                ])
            );
        });

        return writeStream;
    }

    private formatLog(
        formatFor: "FILE",
        level: 0 | 1 | 2 | 3 | 4,
        logs: unknown[]
    ): string;
    private formatLog(
        formatFor: "CONSOLE",
        level: 0 | 1 | 2 | 3 | 4,
        logs: unknown[]
    ): [string, string, string, ...unknown[]];
    private formatLog(
        formatFor: "FILE" | "CONSOLE",
        level: 0 | 1 | 2 | 3 | 4,
        logs: unknown[]
    ): [string, string, string, ...unknown[]] | string {
        if (formatFor === "CONSOLE") {
            return [
                `${this.levelConfigs[level].color}%s %s\x1b[0m`,
                `[${moment.utc().format("YYYY-MM-DD HH:mm:ss")}]`,
                `[${this.levelConfigs[level].name}]`,
                logs
            ];
        } else {
            // Get stack from errors
            logs = logs.reduce((logs: unknown[], log: unknown) => {
                logs.push(log instanceof Error ? log.stack : log);
                return logs;
            }, []);

            return (
                JSON.stringify({
                    level: this.levelConfigs[level].name,
                    dateTime: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
                    message: logs
                }).toString() + "\n"
            );
        }
    }
}
