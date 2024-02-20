import { Client } from "@/classes";
import {
    EmbedBuilder,
    GuildChannelResolvable,
    GuildMember,
    PermissionResolvable
} from "discord.js";

export class Utilities {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public defaultEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTimestamp()
            .setFooter({
                text: `${this.client.user!.username} v${
                    this.client.config.VERSION
                }`
            });
    }

    public parseTime(duration: number | bigint): string {
        if (typeof duration === "bigint") duration = Number(duration);
        let result = "";

        duration = Math.floor(duration / 1000);
        const sec = duration % 60;
        if (duration > 0 && sec > 0) result = sec + "s";

        duration = Math.floor(duration / 60);
        const min = duration % 60;
        if (duration > 0 && min > 0) result = min + "m " + result;

        duration = Math.floor(duration / 60);
        const hour = duration % 24;
        if (duration > 0 && hour > 0) result = hour + "h " + result;

        duration = Math.floor(duration / 24);
        const day = duration % 365;
        if (duration > 0 && day > 0) result = day + "d " + result;

        duration = Math.floor(duration / 365);
        const year = duration;
        if (duration > 0 && year > 0) result = year + "y " + result;

        return result;
    }

    public limitString(string: string, limit: number): string {
        if (string.length > limit) {
            return string.substring(0, limit + 3) + "...";
        } else {
            return string;
        }
    }

    public addNewLines(lines: string[]): string {
        return lines.join("\n");
    }

    public checkPermissions(
        member: GuildMember,
        permissions: PermissionResolvable[],
        channel?: GuildChannelResolvable
    ): { hasAll: true } | { hasAll: false; missing: PermissionResolvable[] } {
        let missing: PermissionResolvable[];

        if (channel) {
            missing = permissions.filter(
                perm => !member.permissionsIn(channel).has(perm)
            );
        } else {
            missing = permissions.filter(perm => !member.permissions.has(perm));
        }

        return missing.length === 0
            ? { hasAll: true }
            : {
                  hasAll: missing.length === 0,
                  missing: missing
              };
    }
}
