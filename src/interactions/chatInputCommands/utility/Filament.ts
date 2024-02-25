import { HandlerResult } from "@/types";
import { ChatInputCommand } from "@/structures";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    ComponentType
} from "discord.js";

export default class FilamentChatInputCommand extends ChatInputCommand {
    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("filament")
                .setDescription("Add, remove or view filaments")
                .addSubcommand(builder =>
                    builder
                        .setName("add")
                        .setDescription("Add a new filament")
                        .addStringOption(builder =>
                            builder
                                .setName("brand")
                                .setDescription("The filament brand")
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("type")
                                .setDescription("The filament type, like PLA")
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("color")
                                .setDescription("The filament color")
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("sku")
                                .setDescription("The filament sku")
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("name")
                                .setDescription(
                                    "A optional name for the filament"
                                )
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("remove")
                        .setDescription("Remove a filament")
                        .addStringOption(builder =>
                            builder
                                .setName("filament")
                                .setDescription("The filaments name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("view")
                        .setDescription("View a filament")
                        .addStringOption(builder =>
                            builder
                                .setName("filament")
                                .setDescription("The filaments name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("list")
                        .setDescription("View a list of all the filaments")
                )
        });
    }

    public async run(i: ChatInputCommandInteraction): Promise<HandlerResult> {
        // Check permissions
        if (i.user.id !== "232163746829697025") {
            this.client.sender.reply(
                i,
                {
                    content:
                        "You don't have the permissions requires to do this"
                },
                { msgType: "INVALID" }
            );
            return { result: "USER_MISSING_PERMISSIONS" };
        }

        // Run the sub command
        switch (i.options.getSubcommand()) {
            case "add":
                return await this.runAddSubCommand(i);
            case "remove":
                return await this.runRemoveSubCommand(i);
            case "view":
                return await this.runViewSubCommand(i);
            case "list":
                return await this.runListSubCommand(i);
        }

        // Sub command not found
        return {
            result: "ERRORED",
            note: "Subcommand executor not found",
            error: new Error("missing executor")
        };
    }

    private async runAddSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Get options
        const brand = i.options.getString("brand", true);
        const sku = i.options.getString("sku", false);
        const type = i.options.getString("type", true);
        const color = i.options.getString("color", true);
        let name = i.options.getString("name", false);
        if (!name)
            name = sku
                ? `${brand} ${sku} ${type} - ${color}`
                : `${brand} ${type} - ${color}`;

        // Check for existing filament
        const existingFilament = await this.client.prisma.filaments.findFirst({
            where: { brand, sku, type, color },
            select: {
                brand: true,
                sku: true,
                type: true,
                name: true,
                color: true
            }
        });

        if (existingFilament) {
            const embed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES.INVALID.COLOR)
                .setTitle("This filament already exists");
            const filamentEmbed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR)
                .setTitle(existingFilament.name)
                .setDescription(
                    this.client.utils.addNewLines([
                        `**Color:** ${existingFilament.color}`,
                        `**Brand:** ${existingFilament.brand}`,
                        existingFilament.sku
                            ? `**Sku:** ${existingFilament.sku}`
                            : "",
                        `**Type:** ${existingFilament.type}`
                    ])
                );

            this.client.sender.reply(i, { embeds: [embed, filamentEmbed] });

            return { result: "INVALID_ARGUMENTS" };
        }

        // Create filament
        await this.client.prisma.filaments.create({
            data: { name, brand, sku, type, color }
        });

        const embed = new EmbedBuilder()
            .setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR)
            .setTitle(name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Color:** ${color}`,
                    `**Brand:** ${brand}`,
                    sku ? `**Sku:** ${sku}` : "",
                    `**Type:** ${type}`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runRemoveSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const filamentId = parseInt(i.options.getString("filament", true));

        // Fetch
        const filament = await this.client.prisma.filaments.findUnique({
            where: { id: filamentId },
            select: {
                name: true,
                color: true,
                brand: true,
                sku: true,
                type: true
            }
        });
        if (!filament) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find filament id in database",
                error: new Error("Filament not found")
            };
        }

        // Create embeds and menu
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle("Are you sure you want to delete the filament?");
        const filamentEmbed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(filament.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Color:** ${filament.color}`,
                    `**Brand:** ${filament.brand}`,
                    filament.sku ? `**Sku:** ${filament.sku}` : "",
                    `**Type:** ${filament.type}`
                ])
            );

        const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("filamentRemoveConfirm")
                .setLabel("Confirm"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId("filamentRemoveCancel")
                .setLabel("Cancel")
        );

        // Confirm action
        const msg = await this.client.sender.reply(i, {
            embeds: [embed, filamentEmbed],
            components: [buttons],
            fetchReply: true
        });
        if (!msg) {
            return {
                result: "ERRORED",
                note: "Message was not fetched",
                error: new Error("No message found")
            };
        }

        const buttonInteraction = await msg
            .awaitMessageComponent<ComponentType.Button>({
                dispose: true,
                filter: i2 => i.user.id === i2.user.id,
                time: 30000
            })
            .catch(() => {
                buttons.components[0].setDisabled(true);
                buttons.components[1].setDisabled(true);
                this.client.sender.reply(
                    i,
                    { components: [buttons] },
                    { method: "EDIT_REPLY" }
                );
            });

        if (!buttonInteraction) {
            return { result: "OTHER", note: "Confirmation timed out" };
        } else if (buttonInteraction.customId === "filamentRemoveCancel") {
            embed.setTitle("Deletion canceled");
            embed.setColor(this.client.config.MSG_TYPES.ERROR.COLOR);
            this.client.sender.reply(
                buttonInteraction,
                { embeds: [embed, filamentEmbed], components: [] },
                { method: "UPDATE" }
            );
            return { result: "SUCCESS" };
        }

        // Delete filament
        await this.client.prisma.filaments.delete({
            where: { id: filamentId }
        });

        embed.setTitle("The filament has been deleted");
        embed.setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR);
        this.client.sender.reply(
            buttonInteraction,
            { embeds: [embed, filamentEmbed], components: [] },
            { method: "UPDATE" }
        );

        // Success
        return { result: "SUCCESS" };
    }

    private async runViewSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const filamentId = parseInt(i.options.getString("filament", true));

        // Fetch
        const filament = await this.client.prisma.filaments.findUnique({
            where: { id: filamentId },
            select: {
                name: true,
                color: true,
                brand: true,
                sku: true,
                type: true
            }
        });
        if (!filament) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find filament id in database",
                error: new Error("Filament not found")
            };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(filament.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Color:** ${filament.color}`,
                    `**Brand:** ${filament.brand}`,
                    filament.sku ? `**Sku:** ${filament.sku}` : "",
                    `**Type:** ${filament.type}`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runListSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Fetch filaments
        const filaments = await this.client.prisma.filaments.findMany({
            select: { name: true },
            orderBy: { name: "asc" }
        });
        if (filaments.length === 0) {
            this.client.sender.reply(
                i,
                { content: "No filaments have been added yet" },
                { msgType: "INVALID" }
            );
            return { result: "SUCCESS" };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setDescription(filaments.map(f => f.name).join("\n"));

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }
}
