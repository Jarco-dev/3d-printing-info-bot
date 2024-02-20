import Client from "../../index";
import { HandlerResult } from "@/types";
import {
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction
} from "discord.js";

export abstract class ChannelSelectMenuComponent {
    protected readonly client = Client;
    public readonly matchRegex?: RegExp;
    public readonly data: ReturnType<ChannelSelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<ChannelSelectMenuBuilder, "toJSON">;
        enabled?: boolean;
        matchRegex?: RegExp;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
        this.matchRegex = p.matchRegex;
    }

    public abstract run(
        i: ChannelSelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
