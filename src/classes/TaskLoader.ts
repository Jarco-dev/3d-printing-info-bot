import cron from "node-cron";
import path from "path";
import fs from "fs";
import { Client } from "@/classes";
import { Task as TaskStructure } from "@/structures";

export class TaskLoader {
    private client: Client;
    public tasks: {
        [cronExpression: string]: TaskStructure[];
    };
    public path: string;

    constructor(client: Client) {
        this.client = client;
        this.tasks = {};
        this.path = path.join(__dirname, "..", "tasks");
    }

    public async loadAllTasks(): Promise<void> {
        // Cancel if there is no tasks folder
        if (!fs.existsSync(path.join(this.path))) return;

        // Get all the tasks
        const items = await fs.promises.readdir(this.path);
        for (const item of items) {
            // Skip the item if it's a folder
            if (fs.lstatSync(path.join(this.path, item)).isDirectory()) {
                continue;
            }

            // Load the task
            try {
                // Require Task file
                const Task = require(path.join(this.path, item)).default;

                // Validate that it's a Task class
                if (!(Task.prototype instanceof TaskStructure)) {
                    continue;
                }

                // Add Task to corresponding list
                const task = new Task();
                if (task.enabled) {
                    if (task.cronExpression in this.tasks) {
                        this.tasks[task.cronExpression] = [task];
                    } else {
                        this.tasks[task.cronExpression] = [task];
                    }

                    // Log loaded message
                    this.client.logger.debug(
                        `[TaskHandler] ${item} task loaded`
                    );
                }
            } catch (err) {
                this.client.logger.error(
                    `Error while trying to load task file ${item}`,
                    err
                );
            }
        }
    }

    public async startAll(): Promise<void> {
        for (const cronExpression in this.tasks) {
            try {
                const tasks = this.tasks[cronExpression];
                cron.schedule(cronExpression, async () => {
                    for (const task of tasks) {
                        try {
                            this.client.logger.verbose(
                                `[TaskHandler] Running ${task.name}`
                            );

                            const data = await task.run();
                            if (data.result === "ERRORED") {
                                this.client.logger.error(
                                    `[TaskHandler] error in result, ${data.note}`,
                                    data.error
                                );
                            }
                        } catch (err) {
                            this.client.logger.error(
                                `Error while running ${task.name}`,
                                err
                            );
                        }
                    }
                });
            } catch (err) {
                this.client.logger.error(
                    "Error while starting a task timer",
                    err
                );
            }
        }
    }
}
