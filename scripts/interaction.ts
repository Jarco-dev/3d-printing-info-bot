import * as path from "path";
import * as fs from "fs";
import * as handlebars from "handlebars";
import { execSync } from "child_process";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { promptInput, promptList, promptConfirm } from "./utils/prompts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getDirs } from "./utils/getDirs";

const selections = new Map();

const interactionTypes = {
    Autocomplete: {
        folder: "autocomplete",
        builder: undefined,
        event: "AutocompleteInteraction"
    },
    ButtonComponent: {
        folder: "buttonComponents",
        builder: "ButtonBuilder",
        event: "ButtonInteraction"
    },
    ChatInputCommand: {
        folder: "chatInputCommands",
        builder: "SlashCommandBuilder",
        event: "ChatInputCommandInteraction"
    },
    MessageContextMenuCommand: {
        folder: "messageContextMenuCommands",
        builder: "ContextMenuCommandBuilder",
        event: "MessageContextMenuCommandInteraction"
    },
    Modal: {
        folder: "modals",
        builder: "ModalBuilder",
        event: "ModalSubmitInteraction"
    },
    StringSelectMenuComponent: {
        folder: "stringSelectMenuComponents",
        builder: "StringSelectMenuBuilder",
        event: "StringSelectMenuInteraction"
    },
    UserSelectMenuComponent: {
        folder: "userSelectMenuComponents",
        builder: "UserSelectMenuBuilder",
        event: "UserSelectMenuInteraction"
    },
    RoleSelectMenuComponent: {
        folder: "roleSelectMenuComponents",
        builder: "RoleSelectMenuBuilder",
        event: "RoleSelectMenuInteraction"
    },
    MentionableSelectMenuComponent: {
        folder: "mentionableSelectMenuComponents",
        builder: "MentionableSelectMenuBuilder",
        event: "MentionableSelectMenuInteraction"
    },
    ChannelSelectMenuComponent: {
        folder: "channelSelectMenuComponents",
        builder: "ChannelSelectMenuBuilder",
        event: "ChannelSelectMenuInteraction"
    },
    UserContextMenuCommand: {
        folder: "userContextMenuCommands",
        builder: "ContextMenuCommandBuilder",
        event: "UserContextMenuCommandInteraction"
    }
};

(async () => {
    // Collect type
    const interactionTypeKeys: (keyof typeof interactionTypes)[] = [];
    for (const key in interactionTypes) {
        interactionTypeKeys.push(key as keyof typeof interactionTypes);
    }
    selections.set(
        "type",
        await promptList("Type:", interactionTypeKeys, false)
    );
    const typeSettings =
        interactionTypes[
            selections.get("type") as keyof typeof interactionTypes
        ];

    const handlerDir = path.resolve(
        process.cwd(),
        "src",
        "interactions",
        typeSettings.folder
    );
    if (!fs.existsSync(handlerDir)) {
        fs.mkdirSync(handlerDir, { recursive: true });
    }

    // Collect (sub)directory
    let dirInput = await promptList(
        "Directory:",
        ["Create new directory", ...getDirs(handlerDir)],
        false
    );

    if (dirInput === "Create new directory") {
        dirInput = await promptInput(
            "Directory name, must use camelCase:",
            false,
            (input: string) => {
                return new Promise((res, rej) => {
                    if (fs.existsSync(path.resolve(handlerDir, input))) {
                        rej("Folder already exists");
                    } else res(input);
                });
            }
        );
        fs.mkdirSync(path.join(handlerDir, dirInput));
    }

    let subDirInput = await promptList(
        "Subdirectory",
        [
            "Create new subdirectory",
            "Don't use a subdirectory",
            ...getDirs(path.resolve(handlerDir, dirInput))
        ],
        false
    );

    if (subDirInput === "Create new subdirectory") {
        subDirInput = await promptInput(
            "Subdirectory name, must use camelCase:",
            false,
            (input: string) => {
                return new Promise((res, rej) => {
                    if (fs.existsSync(path.resolve(dirInput, input))) {
                        rej("Folder already exists");
                    } else res(input);
                });
            }
        );
        fs.mkdirSync(path.join(handlerDir, dirInput, subDirInput));
        selections.set("dir", path.resolve(handlerDir, dirInput, subDirInput));
        selections.set("usesSubDir", true);
    } else if (subDirInput === "Don't use a subdirectory") {
        selections.set("dir", path.resolve(handlerDir, dirInput));
        selections.set("usesSubDir", false);
    } else {
        selections.set("dir", path.resolve(handlerDir, dirInput, subDirInput));
        selections.set("usesSubDir", true);
    }

    // Collect file name
    selections.set(
        "fileName",
        await promptInput(
            "File name, must use PascalCase:",
            false,
            (input: string) => {
                return new Promise((res, rej) => {
                    if (
                        fs.existsSync(
                            path.resolve(selections.get("dir"), input)
                        ) ||
                        fs.existsSync(
                            path.resolve(selections.get("dir"), input + ".ts")
                        )
                    ) {
                        rej("File already exists");
                    } else res(input);
                });
            }
        )
    );

    if (selections.get("fileName").slice(-3) !== ".ts") {
        selections.set("fileName", selections.get("fileName") + ".ts");
    }

    const filePath = path.resolve(
        handlerDir,
        selections.get("dir"),
        selections.get("fileName")
    );

    // Collect command only options
    if (
        [
            "Autocomplete",
            "ChatInputCommand",
            "MessageContextMenuCommand",
            "UserContextMenuCommand"
        ].includes(selections.get("type"))
    ) {
        // Collect handler identifiable
        selections.set(
            "handlerIdentifiable",
            await promptInput(
                "Command name, must follow discords command name requirements:",
                false
            )
        );

        // Collect chat input command description
        if (selections.get("type") === "ChatInputCommand") {
            selections.set(
                "description",
                await promptInput("Description:", false)
            );
        }

        // Collect other command execution options
        else if (
            ["MessageContextMenuCommand", "UserContextMenuCommand"].includes(
                selections.get("type")
            )
        ) {
            // Collect enabled in dm
            selections.set(
                "dm",
                await promptConfirm("Should it be enabled in DM?")
            );

            // Collect default member permissions
            selections.set(
                "defaultMemberPermissions",
                await promptConfirm(
                    "Should default member permissions be set to 0?"
                )
            );
        }
    }

    // Collect non application command only options
    else {
        // Collect handler identifiable
        selections.set(
            "handlerIdentifiable",
            await promptInput("Custom id, must follow camelCase:", false)
        );
    }

    // Create the interaction file
    console.log("\nCreating interaction file...");

    const template = handlebars.compile(
        fs
            .readFileSync(
                path.resolve(
                    handlerDir,
                    "..",
                    "..",
                    "..",
                    "scripts",
                    "templates",
                    "interaction.hbs"
                )
            )
            .toString(),
        { noEscape: true }
    );

    const getExtraDjsImports = (): string => {
        let imports = "";
        if (typeSettings.builder) {
            imports += `, ${typeSettings.builder}`;
        }

        if (
            selections.get("type") === "MessageContextMenuCommand" ||
            selections.get("type") === "UserContextMenuCommand"
        ) {
            imports += ", ApplicationCommandType";
        }
        return imports;
    };

    const getName = (): string => {
        return selections.get("fileName").replace(".ts", "");
    };

    const getBuilderDefaults = (): string => {
        let defaults = "";

        if (
            [
                "ChatInputCommand",
                "MessageContextMenuCommand",
                "UserContextMenuCommand"
            ].includes(selections.get("type"))
        ) {
            if (selections.get("type") === "MessageContextMenuCommand") {
                defaults += ".setType(ApplicationCommandType.Message)";
            } else if (selections.get("type") === "UserContextMenuCommand") {
                defaults += ".setType(ApplicationCommandType.User)";
            }

            defaults += `.setName('${selections.get("handlerIdentifiable")}')`;

            if (selections.get("type") === "ChatInputCommand") {
                defaults += `.setDescription('${selections.get(
                    "description"
                )}')`;
            }

            if (!selections.get("dm")) {
                defaults += ".setDMPermission(false)";
            }

            if (selections.get("defaultMemberPermissions")) {
                defaults += ".setDefaultMemberPermissions(0)";
            }
        } else {
            defaults += `.setCustomId('${selections.get(
                "handlerIdentifiable"
            )}')`;
        }

        return defaults;
    };

    const getGuilds = (): string => {
        const guilds = selections.get("guilds");
        if (!guilds || guilds.length === 0) return "";
        else return `guilds: [${selections.get("guilds")}],\n`;
    };

    let uniqueAttribute;
    let builder;
    if (selections.get("type") === "Autocomplete") {
        uniqueAttribute = `commandName: '${selections.get(
            "handlerIdentifiable"
        )}'`;
    } else if (typeSettings.builder) {
        if (
            [
                "ChatInputCommand",
                "MessageContextMenuCommand",
                "UserContextMenuCommand"
            ].includes(selections.get("type"))
        ) {
            uniqueAttribute = `builder: new ${
                typeSettings.builder
            }()${getBuilderDefaults()}`;
        } else {
            uniqueAttribute = `builder: ${
                getName() + selections.get("type")
            }.builder`;
            builder = `public static readonly builder = new ${
                typeSettings.builder
            }()${getBuilderDefaults()}\n`;
        }
    }

    const compiled = template({
        extraNests: selections.get("usesSubDir") === true ? "../" : "",
        type: selections.get("type"),
        uniqueAttribute,
        builder,
        event: typeSettings.event,
        extraDjsImports: getExtraDjsImports(),
        name: getName(),
        guilds: getGuilds()
    });

    fs.writeFileSync(filePath, compiled);

    // Format interaction file
    try {
        execSync(`npx eslint ${filePath} --fix`);
    } catch (e) {
        console.log("\nFailed to format new interaction file");
        return;
    }

    // Done
    console.log("\nInteraction file created\n");
})();
