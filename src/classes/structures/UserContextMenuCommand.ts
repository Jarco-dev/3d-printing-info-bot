import Client from "../../index";
import { HandlerResult } from "@/types";
import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    UserContextMenuCommandInteraction
} from "discord.js";

export abstract class UserContextMenuCommand {
    protected readonly client = Client;
    public readonly data: ReturnType<ContextMenuCommandBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<ContextMenuCommandBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;

        if (this.data.type !== ApplicationCommandType.User) {
            this.client.logger.warn(
                `${this.data.name} wrong context menu type in builder, handler disabled`
            );
            this.enabled = false;
        }
    }

    public abstract run(
        i: UserContextMenuCommandInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
