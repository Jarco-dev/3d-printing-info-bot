import {
    ButtonInteraction,
    CommandInteraction,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    MessageComponentInteraction,
    Snowflake,
    TextBasedChannel,
    User,
    MessageCreateOptions,
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    UserSelectMenuInteraction,
    RoleSelectMenuInteraction,
    MentionableSelectMenuInteraction
} from "discord.js";
import { Client } from "./";
import { SenderMessageOptions, SenderReplyOptions } from "@/types";
import { EmbedBuilder, Message } from "discord.js";

export class Sender {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public async reply(
        i:
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionUpdateOptions & { fetchReply: true },
        options: SenderReplyOptions & { method: "UPDATE" }
    ): Promise<void | Message>;
    public async reply(
        i:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionReplyOptions & { fetchReply: true },
        options: SenderReplyOptions &
            ({ method: "REPLY" } | { method: "EDIT_REPLY" })
    ): Promise<void | Message>;
    public async reply(
        i:
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionUpdateOptions,
        options: SenderReplyOptions & { method: "UPDATE" }
    ): Promise<void | InteractionResponse>;
    public async reply(
        i:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionReplyOptions,
        options: SenderReplyOptions &
            ({ method: "REPLY" } | { method: "EDIT_REPLY" })
    ): Promise<void | InteractionResponse>;
    public async reply(
        i:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionReplyOptions & { fetchReply: true },
        options?: SenderReplyOptions
    ): Promise<void | Message>;
    public async reply(
        i:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionReplyOptions,
        options?: SenderReplyOptions
    ): Promise<void | InteractionResponse>;
    public async reply(
        i:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | ModalSubmitInteraction,
        payload: InteractionUpdateOptions | InteractionReplyOptions,
        options?: SenderReplyOptions
    ): Promise<void | Message | InteractionResponse> {
        // No options shortcut
        if (!options) return i.reply(payload as InteractionReplyOptions);

        // Handle the bot message type
        if (options.msgType) {
            // Cancel message type reply if there is an embed
            if (payload.embeds)
                throw new Error(
                    "The provided embed would be overwritten by the msgType"
                );

            // Create and send the embed
            const embed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES[options.msgType].COLOR)
                .setDescription(
                    `${this.client.config.MSG_TYPES[options.msgType].EMOJI} **${
                        payload.content
                    }**`
                );

            delete payload.content;
            payload.embeds = [embed];
        }

        // Fetch the reply if needed for SenderReplyOptions
        if (options.delTime) payload.fetchReply = true;

        // Send the message
        let msg: Message | InteractionResponse | void;
        if (options.method === "EDIT_REPLY")
            msg = await i.editReply(payload as InteractionReplyOptions);
        else if (options.method === "UPDATE") {
            if (i.isMessageComponent())
                msg = await i.update(payload as InteractionUpdateOptions);
            else
                throw new Error(
                    "The UPDATE method can only be used on MessageComponentInteractions"
                );
        } else if (options.method === "FOLLOW_UP") {
            msg = await i.followUp(payload as InteractionReplyOptions);
        } else msg = await i.reply(payload as InteractionReplyOptions);

        if (options.delTime && msg instanceof Message && msg.deletable) {
            // Delete timeout
            const msg1 = msg;
            setTimeout(() => msg1.delete().catch(() => {}), options.delTime);

            // Return message
            return msg;
        }
    }

    public send(
        origin:
            | CommandInteraction
            | ButtonInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction
            | Message,
        payload: MessageCreateOptions,
        options?: SenderMessageOptions
    ): Promise<void | Message> | void {
        const channel = origin.channel;
        if (channel) return this._sendMsg(channel, payload, options);
    }

    public async msgChannel(
        channel: TextBasedChannel | Snowflake,
        payload: MessageCreateOptions,
        options?: SenderMessageOptions
    ): Promise<void | Message> {
        const snowflake = `${channel}`.match(/[0-9]+/)?.[0];
        if (snowflake) {
            const fetchedChannel = await this.client.channels
                .fetch(snowflake)
                .catch(() => {});
            if (fetchedChannel && fetchedChannel.isTextBased())
                return this._sendMsg(fetchedChannel, payload, options);
        }
    }

    public async msgUser(
        user: User | Snowflake,
        payload: MessageCreateOptions,
        options?: SenderMessageOptions
    ): Promise<void | Message> {
        const snowflake = `${user}`.match(/[0-9]+/)?.[0];
        if (snowflake) {
            const fetchedUser = await this.client.users
                .fetch(snowflake)
                .catch(() => {});
            if (fetchedUser)
                return this._sendMsg(
                    await fetchedUser.createDM(),
                    payload,
                    options
                );
        }
    }

    private _sendMsg(
        channel: TextBasedChannel,
        payload: MessageCreateOptions,
        options?: SenderMessageOptions
    ): Promise<void | Message> {
        // No options shortcut
        if (!options) return channel.send(payload);

        // Handle the bot message type
        if (options.msgType) {
            // Cancel message type reply if there is an embed
            if (payload.embeds)
                throw new Error(
                    "The provided embed would be overwritten by the msgType"
                );

            // Create and send the embed
            const embed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES[options.msgType].COLOR)
                .setDescription(
                    `${this.client.config.MSG_TYPES[options.msgType].EMOJI} **${
                        payload.content
                    }**`
                );

            delete payload.content;
            payload.embeds = [embed];
        }

        // Send the message
        return channel.send(payload).then(msg => {
            // Message delete timeout
            if (options.delTime)
                setTimeout(() => msg.delete().catch(() => {}), options.delTime);
        });
    }
}
