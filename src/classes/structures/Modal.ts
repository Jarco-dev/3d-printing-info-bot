import Client from "../../index";
import { HandlerResult } from "@/types";
import { ModalBuilder, ModalSubmitInteraction } from "discord.js";

export abstract class Modal {
    protected readonly client = Client;
    public readonly data: ReturnType<ModalBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<ModalBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: ModalSubmitInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
