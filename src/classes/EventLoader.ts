import Client from "../index";
import fs from "fs";
import path from "path";
import { EventHandler as EventHandlerStructure } from "@/structures";

export class EventLoader {
    public path: string;
    private client: typeof Client;

    constructor(client: typeof Client) {
        this.client = client;
        this.path = path.join(__dirname, "..", "events");
    }

    public async loadAllHandlers(): Promise<void> {
        // Get all the folders
        const folders = await fs.promises.readdir(this.path);
        for (const folder of folders) {
            // Load the events if it's a folder
            if (fs.lstatSync(path.join(this.path, folder)).isDirectory()) {
                const files = fs.readdirSync(path.join(this.path, folder));
                // Go through all the event files
                for (const file of files) {
                    // Load the event
                    try {
                        // Require EventHandler file
                        const EventHandler = require(path.join(
                            this.path,
                            folder,
                            file
                        )).default;

                        // Validate that it's a EventHandler class
                        if (
                            !(
                                EventHandler.prototype instanceof
                                EventHandlerStructure
                            )
                        ) {
                            continue;
                        }

                        // Get EventHandler & is enabled
                        const eventHandler = new EventHandler();
                        if (!eventHandler.enabled) continue;

                        // Bind event handler
                        this.client.on(eventHandler.name, () => {
                            this.client.logger.verbose(
                                `[EventHandler] ${file} handler triggered`
                            );
                        });
                        this.client.on(
                            eventHandler.name,
                            eventHandler.run.bind(eventHandler)
                        );

                        // Log loaded message
                        this.client.logger.debug(
                            `[EventHandler] ${file} handler loaded`
                        );
                    } catch (err) {
                        this.client.logger.error(
                            `Error while trying to load handler file ${file}`,
                            err
                        );
                    }
                }
            }
        }
    }
}
