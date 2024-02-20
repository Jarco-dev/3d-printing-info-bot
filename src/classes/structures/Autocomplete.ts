import Client from "../../index";
import { HandlerResult } from "@/types";
import { AutocompleteInteraction } from "discord.js";

export abstract class Autocomplete {
    protected readonly client = Client;
    public readonly matchRegex?: RegExp;
    public readonly data: { commandName: string };
    public readonly enabled: boolean;

    protected constructor(p: {
        commandName: string;
        enabled?: boolean;
        matchRegex?: RegExp;
    }) {
        this.data = { commandName: p.commandName };
        this.enabled = p.enabled ?? true;
        this.matchRegex = p.matchRegex;
    }

    public abstract run(
        i: AutocompleteInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
