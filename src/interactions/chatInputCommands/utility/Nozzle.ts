import { HandlerResult } from "@/types";
import { ChatInputCommand } from "@/structures";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";

export default class NozzleChatInputCommand extends ChatInputCommand {
    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("nozzle")
                .setDescription("Add, view or remove nozzles")
                .addSubcommand(builder =>
                    builder
                        .setName("add")
                        .setDescription("Add a nozzle")
                        .addStringOption(builder =>
                            builder
                                .setName("brand")
                                .setDescription("The brand")
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("material")
                                .setDescription(
                                    "The material it is made out of"
                                )
                                .setRequired(true)
                                .setChoices(
                                    { name: "Brass", value: "BRASS" },
                                    {
                                        name: "Stainless Steel",
                                        value: "STAINLESS_STEEL"
                                    },
                                    {
                                        name: "Hardened Steel",
                                        value: "HARDENED_STEEL"
                                    }
                                )
                        )
                        .addNumberOption(builder =>
                            builder
                                .setName("diameter")
                                .setDescription("The diameter in millimeters")
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("name")
                                .setDescription("The nozzle's name")
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("remove")
                        .setDescription("Remove a nozzle")
                        .addStringOption(builder =>
                            builder
                                .setName("nozzle")
                                .setDescription("The nozzle's name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("view")
                        .setDescription("View a nozzle")
                        .addStringOption(builder =>
                            builder
                                .setName("nozzle")
                                .setDescription("The nozzle's name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )

                .addSubcommand(builder =>
                    builder
                        .setName("list")
                        .setDescription("View a list of all the nozzles")
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
                return this.runAddSubCommand(i);
            case "remove":
                return this.runRemoveSubCommand(i);
            case "view":
                return this.runViewSubCommand(i);
            case "list":
                return this.runListSubCommand(i);
        }

        // Sub command not found
        return {
            result: "ERRORED",
            note: "Subcommand executor not found",
            error: new Error("missing executor")
        };
    }

    public async runAddSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const brand = i.options.getString("brand", true);
        const material = i.options.getString("material", true);
        const diameter = i.options.getNumber("diameter", true);
        let name = i.options.getString("name");
        if (!name)
            name = `${brand} ${material
                .replace("_", " ")
                .toLowerCase()} ${diameter}mm`;

        // Check for existing
        const existingNozzle = await this.client.prisma.nozzles.findFirst({
            where: { brand, material, diameter },
            select: { brand: true, material: true, diameter: true, name: true }
        });

        if (existingNozzle) {
            const embed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES.INVALID.COLOR)
                .setTitle("This nozzle already exists");
            const nozzleEmbed = new EmbedBuilder()
                .setColor(this.client.config.COLORS.DEFAULT)
                .setTitle(existingNozzle.name)
                .setDescription(
                    this.client.utils.addNewLines([
                        `**Brand:** ${existingNozzle.brand}`,
                        `**Material:** ${existingNozzle.material
                            .replace("_", " ")
                            .toLowerCase()}`,
                        `**Diameter:** ${existingNozzle.diameter}mm`
                    ])
                );

            this.client.sender.reply(i, { embeds: [embed, nozzleEmbed] });

            return { result: "INVALID_ARGUMENTS" };
        }

        // Create nozzle
        await this.client.prisma.nozzles.create({
            data: { brand, material, diameter, name }
        });

        const embed = new EmbedBuilder()
            .setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR)
            .setTitle(name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Brand:** ${brand}`,
                    `**Material:** ${material.replace("_", " ").toLowerCase()}`,
                    `**Diameter:** ${diameter}mm`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    public async runRemoveSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const nozzleId = parseInt(i.options.getString("nozzle", true));

        // Fetch
        const nozzle = await this.client.prisma.nozzles.findUnique({
            where: { id: nozzleId },
            select: {
                name: true,
                brand: true,
                material: true,
                diameter: true
            }
        });
        if (!nozzle) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find nozzle id in database",
                error: new Error("Nozzle not found")
            };
        }

        // Create embeds and menu
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle("Are you sure you want to delete the nozzle?");
        const nozzleEmbed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(nozzle.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Brand:** ${nozzle.brand}`,
                    `**Material:** ${nozzle.material
                        .replace("_", " ")
                        .toLowerCase()}`,
                    `**Diameter:** ${nozzle.diameter}mm`
                ])
            );

        const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("nozzleRemoveConfirm")
                .setLabel("Confirm"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId("nozzleRemoveCancel")
                .setLabel("Cancel")
        );

        // Confirm action
        const msg = await this.client.sender.reply(i, {
            embeds: [embed, nozzleEmbed],
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
        } else if (buttonInteraction.customId === "nozzleRemoveCancel") {
            embed.setTitle("Deletion canceled");
            embed.setColor(this.client.config.MSG_TYPES.ERROR.COLOR);
            this.client.sender.reply(
                buttonInteraction,
                { embeds: [embed, nozzleEmbed], components: [] },
                { method: "UPDATE" }
            );
            return { result: "SUCCESS" };
        }

        // Delete nozzle
        await this.client.prisma.nozzles.delete({
            where: { id: nozzleId }
        });

        embed.setTitle("The nozzle has been deleted");
        embed.setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR);
        this.client.sender.reply(
            buttonInteraction,
            { embeds: [embed, nozzleEmbed], components: [] },
            { method: "UPDATE" }
        );

        // Success
        return { result: "SUCCESS" };
    }

    public async runViewSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const nozzleId = parseInt(i.options.getString("nozzle", true));

        // Fetch
        const nozzle = await this.client.prisma.nozzles.findUnique({
            where: { id: nozzleId },
            select: {
                name: true,
                brand: true,
                material: true,
                diameter: true
            }
        });
        if (!nozzle) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find nozzle id in database",
                error: new Error("Nozzle not found")
            };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(nozzle.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**Brand:** ${nozzle.brand}`,
                    `**Material:** ${nozzle.material
                        .replace("_", " ")
                        .toLowerCase()}`,
                    `**Diameter:** ${nozzle.diameter}mm`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runListSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Fetch nozzles
        const nozzles = await this.client.prisma.nozzles.findMany({
            select: { name: true },
            orderBy: { name: "asc" }
        });
        if (nozzles.length === 0) {
            this.client.sender.reply(
                i,
                { content: "No nozzles have been added yet" },
                { msgType: "INVALID" }
            );
            return { result: "SUCCESS" };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setDescription(nozzles.map(n => n.name).join("\n"));

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }
}
