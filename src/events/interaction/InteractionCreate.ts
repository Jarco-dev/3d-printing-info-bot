import { HandlerResult } from "@/types";
import { Interaction } from "discord.js";
import { EventHandler } from "@/structures";

export default class InteractionCreateEventHandler extends EventHandler<"interactionCreate"> {
    constructor() {
        super({
            name: "interactionCreate"
        });
    }

    public run(i: Interaction): HandlerResult | Promise<HandlerResult> {
        // InteractionLoader
        try {
            this.client.interactionLoader.handleInteractionCreate(i);
        } catch (err: any) {
            this.client.logger.error(
                "Error while handling interaction in interactionLoader",
                err
            );
            return {
                result: "ERRORED",
                note: "Error while handling interaction in interactionLoader",
                error: err
            };
        }

        // Success
        return { result: "SUCCESS" };
    }
}
