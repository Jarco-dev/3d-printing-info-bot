import Client from "../../index";
import { HandlerResult } from "@/types";
import { ButtonBuilder, ButtonInteraction } from "discord.js";

export abstract class ButtonComponent {
    protected readonly client = Client;
    public readonly matchRegex?: RegExp;
    public readonly data: ReturnType<ButtonBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<ButtonBuilder, "toJSON">;
        enabled?: boolean;
        matchRegex?: RegExp;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
        this.matchRegex = p.matchRegex;
    }

    public abstract run(
        i: ButtonInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
