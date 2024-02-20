import Client from "../../index";
import { HandlerResult } from "@/types";
import { UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js";

export abstract class UserSelectMenuComponent {
    protected readonly client = Client;
    public readonly matchRegex?: RegExp;
    public readonly data: ReturnType<UserSelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<UserSelectMenuBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: UserSelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
