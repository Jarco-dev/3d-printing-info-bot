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
import { table as createTable } from "table";
import { Prisma } from "@prisma/client";

export default class PurgeVolumeChatInputCommand extends ChatInputCommand {
    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("purge-volume")
                .setDescription("Add, view or remove purge volumes")
                .addSubcommand(builder =>
                    builder
                        .setName("add")
                        .setDescription("Add a filament purge volume")
                        .addStringOption(builder =>
                            builder
                                .setName("from")
                                .setDescription("The starting filament")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("to")
                                .setDescription("the ending filament")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("nozzle")
                                .setDescription(
                                    "The nozzle used to measure the purge volume"
                                )
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addNumberOption(builder =>
                            builder
                                .setName("volume")
                                .setDescription(
                                    "The needed purge volume in cubic millimeters"
                                )
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("name")
                                .setDescription("A name for the purge volume")
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("remove")
                        .setDescription("Remove a filament purge volume")
                        .addStringOption(builder =>
                            builder
                                .setName("purge-volume")
                                .setDescription("The purge volume to remove")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("view")
                        .setDescription("View a purge volume")
                        .addStringOption(builder =>
                            builder
                                .setName("purge-volume")
                                .setDescription("The purge volume to remove")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("view-multiple")
                        .setDescription(
                            "Get a table with all the purge volumes between the filaments"
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("nozzle")
                                .setDescription("The nozzle that will be used")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("filament-1")
                                .setDescription("The first filament")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("filament-2")
                                .setDescription("The second filament")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("filament-3")
                                .setDescription("The third filament")
                                .setAutocomplete(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("filament-4")
                                .setDescription("The fourth filament")
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("list")
                        .setDescription("View a list of the purge volumes")
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
            case "view-multiple":
                return this.runViewMultipleSubCommand(i);
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

    private async runAddSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const fromFilamentId = parseInt(i.options.getString("from", true));
        const toFilamentId = parseInt(i.options.getString("to", true));
        const nozzleId = parseInt(i.options.getString("nozzle", true));
        const volume = i.options.getNumber("volume", true);
        let name = i.options.getString("name");

        // Validate arguments
        if (fromFilamentId === toFilamentId) {
            this.client.sender.reply(
                i,
                { content: "The same 2 filaments will always have 0 purge" },
                { msgType: "INVALID" }
            );
            return { result: "INVALID_ARGUMENTS" };
        }

        // Check for existing filament
        const existingPurgeVolume =
            await this.client.prisma.filamentPurgeVolumes.findFirst({
                where: { fromFilamentId, toFilamentId, nozzleId },
                select: {
                    name: true,
                    volume: true,
                    FromFilament: {
                        select: {
                            name: true
                        }
                    },
                    ToFilament: {
                        select: {
                            name: true
                        }
                    },
                    Nozzle: {
                        select: {
                            name: true
                        }
                    }
                }
            });

        if (existingPurgeVolume) {
            const embed = new EmbedBuilder()
                .setColor(this.client.config.MSG_TYPES.INVALID.COLOR)
                .setTitle("This purge volume already exists");
            const purgeVolumeEmbed = new EmbedBuilder()
                .setColor(this.client.config.COLORS.DEFAULT)
                .setTitle(existingPurgeVolume.name)
                .setDescription(
                    this.client.utils.addNewLines([
                        `**From:** ${existingPurgeVolume.FromFilament.name}`,
                        `**To:** ${existingPurgeVolume.ToFilament.name}`,
                        `**Nozzle:** ${existingPurgeVolume.Nozzle.name}`,
                        `**Volume:** ${existingPurgeVolume.volume}mm3`
                    ])
                );

            this.client.sender.reply(i, { embeds: [embed, purgeVolumeEmbed] });

            return { result: "INVALID_ARGUMENTS" };
        }

        // Fetch filaments and nozzle
        const fromFilament = await this.client.prisma.filaments.findUnique({
            where: { id: fromFilamentId },
            select: { name: true }
        });
        const toFilament = await this.client.prisma.filaments.findUnique({
            where: { id: toFilamentId },
            select: { name: true }
        });
        const nozzle = await this.client.prisma.nozzles.findUnique({
            where: { id: nozzleId },
            select: { name: true }
        });

        if (!fromFilament || !toFilament || !nozzle) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find 1 or more of the filaments",
                error: new Error("filament(s) not found")
            };
        }

        // Create purge volume
        name = name
            ? name
            : `${nozzle.name} | ${fromFilament.name} ➡ ${toFilament.name}`;
        await this.client.prisma.filamentPurgeVolumes.create({
            data: {
                fromFilamentId: fromFilamentId,
                toFilamentId: toFilamentId,
                nozzleId: nozzleId,
                volume,
                name
            }
        });

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR)
            .setTitle(name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**From:** ${fromFilament.name}`,
                    `**To:** ${toFilament.name}`,
                    `**Nozzle:** ${nozzle.name}`,
                    `**Volume:** ${volume}mm3`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runRemoveSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const purgeVolumeId = parseInt(
            i.options.getString("purge-volume", true)
        );

        // Fetch
        const purgeVolume =
            await this.client.prisma.filamentPurgeVolumes.findUnique({
                where: { id: purgeVolumeId },
                select: {
                    name: true,
                    volume: true,
                    FromFilament: {
                        select: {
                            name: true
                        }
                    },
                    ToFilament: {
                        select: {
                            name: true
                        }
                    },
                    Nozzle: {
                        select: {
                            name: true
                        }
                    }
                }
            });
        if (!purgeVolume) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find purge volume id in database",
                error: new Error("Purge volume not found")
            };
        }

        // Create embeds and menu
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle("Are you sure you want to delete the purge volume?");
        const purgeVolumeEmbed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(purgeVolume.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**From:** ${purgeVolume.FromFilament.name}`,
                    `**To:** ${purgeVolume.ToFilament.name}`,
                    `**Nozzle:** ${purgeVolume.Nozzle.name}`,
                    `**Volume:** ${purgeVolume.volume}mm3`
                ])
            );

        const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("purgeVolumeRemoveConfirm")
                .setLabel("Confirm"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId("purgeVolumeRemoveCancel")
                .setLabel("Cancel")
        );

        // Confirm action
        const msg = await this.client.sender.reply(i, {
            embeds: [embed, purgeVolumeEmbed],
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
        } else if (buttonInteraction.customId === "purgeVolumeRemoveCancel") {
            embed.setTitle("Deletion canceled");
            embed.setColor(this.client.config.MSG_TYPES.ERROR.COLOR);
            this.client.sender.reply(
                buttonInteraction,
                { embeds: [embed, purgeVolumeEmbed], components: [] },
                { method: "UPDATE" }
            );
            return { result: "SUCCESS" };
        }

        // Delete purge volume
        await this.client.prisma.filamentPurgeVolumes.delete({
            where: { id: purgeVolumeId }
        });

        embed.setTitle("The purge volume has been deleted");
        embed.setColor(this.client.config.MSG_TYPES.SUCCESS.COLOR);
        this.client.sender.reply(
            buttonInteraction,
            { embeds: [embed, purgeVolumeEmbed], components: [] },
            { method: "UPDATE" }
        );

        // Success
        return { result: "SUCCESS" };
    }

    private async runViewSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const purgeVolumeId = parseInt(
            i.options.getString("purge-volume", true)
        );

        // Fetch
        const purgeVolume =
            await this.client.prisma.filamentPurgeVolumes.findUnique({
                where: { id: purgeVolumeId },
                select: {
                    name: true,
                    volume: true,
                    FromFilament: {
                        select: {
                            name: true
                        }
                    },
                    ToFilament: {
                        select: {
                            name: true
                        }
                    },
                    Nozzle: {
                        select: {
                            name: true
                        }
                    }
                }
            });
        if (!purgeVolume) {
            this.client.sender.reply(
                i,
                { content: "Something went wrong!", ephemeral: true },
                { msgType: "ERROR" }
            );
            return {
                result: "ERRORED",
                note: "Unable to find purge volume id in database",
                error: new Error("Purge volume not found")
            };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle(purgeVolume.name)
            .setDescription(
                this.client.utils.addNewLines([
                    `**From:** ${purgeVolume.FromFilament.name}`,
                    `**To:** ${purgeVolume.ToFilament.name}`,
                    `**Nozzle:** ${purgeVolume.Nozzle.name}`,
                    `**Volume:** ${purgeVolume.volume}mm3`
                ])
            );

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runViewMultipleSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        const nozzleId = parseInt(i.options.getString("nozzle", true));
        const filament1Id = parseInt(i.options.getString("filament-1", true));
        const filament2Id = parseInt(i.options.getString("filament-2", true));
        const filament3Id = parseInt(
            i.options.getString("filament-3") || "NaN"
        );
        const filament4Id = parseInt(
            i.options.getString("filament-4") || "NaN"
        );

        // Check for duplicates
        const ids = [filament1Id, filament2Id, filament3Id, filament4Id].filter(
            i => !isNaN(i)
        );
        const duplicates = ids.filter(
            (item, index) => ids.indexOf(item) !== index
        );
        if (duplicates.length > 0) {
            this.client.sender.reply(
                i,
                { content: "You can't provide duplicate filaments" },
                { msgType: "INVALID" }
            );
            return { result: "INVALID_ARGUMENTS" };
        }

        // Fetch data
        let orArray: Prisma.FilamentPurgeVolumesWhereInput[];

        if (isNaN(filament3Id) && isNaN(filament4Id)) {
            orArray = [
                { fromFilamentId: filament1Id, toFilamentId: filament2Id },
                { fromFilamentId: filament2Id, toFilamentId: filament1Id }
            ];
        } else if (!isNaN(filament3Id) && !isNaN(filament4Id)) {
            orArray = [
                {
                    fromFilamentId: filament1Id,
                    toFilamentId: {
                        in: [filament2Id, filament3Id, filament4Id]
                    }
                },
                {
                    fromFilamentId: filament2Id,
                    toFilamentId: {
                        in: [filament1Id, filament3Id, filament4Id]
                    }
                },
                {
                    fromFilamentId: filament3Id,
                    toFilamentId: {
                        in: [filament1Id, filament2Id, filament4Id]
                    }
                },
                {
                    fromFilamentId: filament4Id,
                    toFilamentId: {
                        in: [filament1Id, filament2Id, filament3Id]
                    }
                }
            ];
        } else {
            const extraFilament = !isNaN(filament3Id)
                ? filament3Id
                : filament4Id;
            orArray = [
                {
                    fromFilamentId: filament1Id,
                    toFilamentId: { in: [filament2Id, extraFilament] }
                },
                {
                    fromFilamentId: filament2Id,
                    toFilamentId: { in: [filament1Id, extraFilament] }
                },
                {
                    fromFilamentId: extraFilament,
                    toFilamentId: { in: [filament1Id, filament2Id] }
                }
            ];
        }

        const dbPurgeVolumes =
            await this.client.prisma.filamentPurgeVolumes.findMany({
                where: {
                    nozzleId: nozzleId,
                    OR: orArray
                },
                select: {
                    fromFilamentId: true,
                    toFilamentId: true,
                    volume: true
                }
            });

        const filaments = await this.client.prisma.filaments.findMany({
            where: {
                id: {
                    in: [
                        filament1Id,
                        filament2Id,
                        filament3Id,
                        filament4Id
                    ].filter(n => !isNaN(n))
                }
            },
            select: {
                id: true,
                color: true
            }
        });

        // Parse data
        const positions = {
            [filament1Id]: 1,
            [filament2Id]: 2,
            [filament3Id]: 3,
            [filament4Id]: 4
        };

        const table = [
            ["From \\ To", undefined, undefined, undefined, undefined],
            [undefined, 0, "-", "-", "-"],
            [undefined, "-", 0, "-", "-"],
            [undefined, "-", "-", 0, "-"],
            [undefined, "-", "-", "-", 0]
        ];

        for (const pv of dbPurgeVolumes) {
            table[positions[pv.fromFilamentId]][positions[pv.toFilamentId]] =
                pv.volume;
        }

        for (const fm of filaments) {
            table[0][positions[fm.id]] = fm.color;
            table[positions[fm.id]][0] = fm.color;
        }

        for (let i = table.length - 1; i >= 3; i--) {
            if (table[0][i]) continue;

            table.splice(i, 1);
            table.forEach(row => row.splice(i, 1));
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setTitle("Filament purge values")
            .setDescription(`\`\`\`${createTable(table)}\`\`\``);

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }

    private async runListSubCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Fetch purge volumes
        const purgeVolumes =
            await this.client.prisma.filamentPurgeVolumes.findMany({
                select: { name: true },
                orderBy: { name: "asc" }
            });
        if (purgeVolumes.length === 0) {
            this.client.sender.reply(
                i,
                { content: "No purge volumes have been added yet" },
                { msgType: "INVALID" }
            );
            return { result: "SUCCESS" };
        }

        // Create and send embed
        const embed = new EmbedBuilder()
            .setColor(this.client.config.COLORS.DEFAULT)
            .setDescription(purgeVolumes.map(n => n.name).join("\n"));

        this.client.sender.reply(i, { embeds: [embed] });

        // Success
        return { result: "SUCCESS" };
    }
}
