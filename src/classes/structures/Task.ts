import Client from "../../index";
import { TimerTaskResult } from "@/types";

export abstract class Task {
    protected readonly client = Client;
    public readonly name: string;
    public readonly cronExpression: string;
    public readonly enabled: boolean;

    protected constructor(p: {
        name: string;
        cronExpression: string;
        enabled?: boolean;
    }) {
        this.name = p.name;
        this.cronExpression = p.cronExpression;
        this.enabled = p.enabled ?? true;
    }

    public abstract run(): TimerTaskResult | Promise<TimerTaskResult>;
}
