import { HandlerResult } from "@/types";
import { EventHandler } from "@/structures";

export default class ReadyEventHandler extends EventHandler<"ready"> {
    constructor() {
        super({
            name: "ready"
        });
    }

    public run(): HandlerResult | Promise<HandlerResult> {
        // Log logged in
        this.client.logger.info(`${this.client.user!.tag} logged in`);

        // Update commands
        this.client.interactionLoader.updateApplicationCommands();

        // Start tasks
        this.client.taskLoader.startAll();

        // Start metrics
        this.client.metrics.start();

        // Success
        return { result: "SUCCESS" };
    }
}
