import { TimerTaskResult } from "@/types";
import { Task } from "@/structures";
import { ActivityType } from "discord.js";

export default class PresenceTask extends Task {
    constructor() {
        super({
            name: "Presence",
            cronExpression: "*/5 * * * *"
        });
    }

    run(): TimerTaskResult | Promise<TimerTaskResult> {
        // Update presence
        this.client.user!.setPresence({
            status: "online",
            activities: [
                {
                    type: ActivityType.Watching,
                    name: `${this.client.guilds.cache.reduce(
                        (a, g) => (a += g.memberCount),
                        0
                    )} users`
                }
            ]
        });

        // Success
        return { result: "SUCCESS" };
    }
}
