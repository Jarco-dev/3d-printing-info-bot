import Client from "../../index";
import { HandlerResult } from "@/types";
import { ClientEvents } from "discord.js";

export abstract class EventHandler<Event extends keyof ClientEvents> {
    protected readonly client = Client;
    public readonly name: Event;
    public readonly enabled: boolean;

    protected constructor(p: { name: Event; enabled?: boolean }) {
        this.name = p.name;
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        ...args: ClientEvents[Event]
    ): HandlerResult | Promise<HandlerResult>;
}
