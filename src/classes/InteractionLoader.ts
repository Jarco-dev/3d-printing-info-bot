import fs from "fs";
import path from "path";
import {
    Autocomplete,
    ButtonComponent,
    ChatInputCommand,
    UserContextMenuCommand,
    Modal,
    MessageContextMenuCommand,
    ChannelSelectMenuComponent,
    MentionableSelectMenuComponent,
    RoleSelectMenuComponent,
    StringSelectMenuComponent,
    UserSelectMenuComponent
} from "@/structures";
import { Client } from "@/classes";
import {
    ApplicationCommandDataResolvable,
    ButtonStyle,
    Interaction
} from "discord.js";

interface GroupedHandlers {
    autocomplete: { [key: string]: Autocomplete };
    buttonComponents: { [key: string]: ButtonComponent };
    chatInputCommands: { [key: string]: ChatInputCommand };
    messageContextMenuCommands: { [key: string]: MessageContextMenuCommand };
    modals: { [key: string]: Modal };
    stringSelectMenuComponents: { [key: string]: StringSelectMenuComponent };
    channelSelectMenuComponents: { [key: string]: ChannelSelectMenuComponent };
    roleSelectMenuComponents: { [key: string]: RoleSelectMenuComponent };
    mentionableSelectMenuComponents: {
        [key: string]: MentionableSelectMenuComponent;
    };
    userSelectMenuComponents: { [key: string]: UserSelectMenuComponent };
    userContextMenuCommands: { [key: string]: UserContextMenuCommand };
}

type GroupedMatchRegex = {
    [key in keyof GroupedHandlers]: { regex: RegExp; handlerName: string }[];
};

type GroupKeys = keyof GroupedHandlers;
type HandlerTypes = GroupedHandlers[GroupKeys][string];

export class InteractionLoader {
    protected readonly client: Client;
    public readonly groupedHandlers: GroupedHandlers;
    public readonly groupedMatchRegex: GroupedMatchRegex;
    public readonly handlersTypeConfig: {
        name: GroupKeys;
        folderDir: string;
        validateHandler: (handler: unknown) => boolean;
    }[];

    constructor(client: Client) {
        this.client = client;

        this.groupedHandlers = {
            autocomplete: {},
            buttonComponents: {},
            chatInputCommands: {},
            messageContextMenuCommands: {},
            modals: {},
            stringSelectMenuComponents: {},
            userContextMenuCommands: {},
            channelSelectMenuComponents: {},
            mentionableSelectMenuComponents: {},
            roleSelectMenuComponents: {},
            userSelectMenuComponents: {}
        };

        this.groupedMatchRegex = {
            autocomplete: [],
            buttonComponents: [],
            chatInputCommands: [],
            messageContextMenuCommands: [],
            modals: [],
            stringSelectMenuComponents: [],
            channelSelectMenuComponents: [],
            mentionableSelectMenuComponents: [],
            roleSelectMenuComponents: [],
            userSelectMenuComponents: [],
            userContextMenuCommands: []
        };

        this.handlersTypeConfig = [
            {
                name: "autocomplete",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "autocomplete"
                ),
                validateHandler: handler => {
                    return handler instanceof Autocomplete;
                }
            },
            {
                name: "buttonComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "buttonComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof ButtonComponent;
                }
            },
            {
                name: "chatInputCommands",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "chatInputCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof ChatInputCommand;
                }
            },
            {
                name: "messageContextMenuCommands",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "messageContextMenuCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof MessageContextMenuCommand;
                }
            },
            {
                name: "modals",
                folderDir: path.join(__dirname, "..", "interactions", "modals"),
                validateHandler: handler => {
                    return handler instanceof Modal;
                }
            },
            {
                name: "stringSelectMenuComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "stringSelectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof StringSelectMenuComponent;
                }
            },
            {
                name: "userSelectMenuComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "userSelectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof UserSelectMenuComponent;
                }
            },
            {
                name: "roleSelectMenuComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "roleSelectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof RoleSelectMenuComponent;
                }
            },
            {
                name: "mentionableSelectMenuComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "mentionableSelectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof MentionableSelectMenuComponent;
                }
            },
            {
                name: "channelSelectMenuComponents",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "channelSelectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof ChannelSelectMenuComponent;
                }
            },
            {
                name: "userContextMenuCommands",
                folderDir: path.join(
                    __dirname,
                    "..",
                    "interactions",
                    "userContextMenuCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof UserContextMenuCommand;
                }
            }
        ];
    }

    public async loadAllHandlers(): Promise<void> {
        for (const config of this.handlersTypeConfig) {
            this.loadInteractionHandler(config);
        }
    }

    private async loadInteractionHandler(p: {
        name: GroupKeys;
        folderDir: string;
        validateHandler: (handler: unknown) => boolean;
    }) {
        const loadHandlers = async (dir: string) => {
            // Get all items in the dir
            if (!fs.existsSync(dir)) return;
            const items = await fs.promises.readdir(dir);

            // Loop through all items
            for (const item of items) {
                const stat = fs.lstatSync(path.join(dir, item));

                // Load files inside of folder
                if (stat.isDirectory()) {
                    loadHandlers(path.join(dir, item));
                }

                // Load handler if it's a file ending with .ts
                if (stat.isFile()) {
                    let handler: HandlerTypes;
                    try {
                        // Validate that the handler is the correct class type
                        const Handler = require(path.join(dir, item)).default;
                        if (p.validateHandler(Handler.prototype)) {
                            handler = new Handler(this.client);

                            // Don't allow buttons of style "LINK"
                            if (
                                handler instanceof ButtonComponent &&
                                handler.data.style === ButtonStyle.Link
                            ) {
                                this.client.logger.warn(
                                    `Button of style "LINK" not allowed, skipping handler file: ${item}`
                                );
                                return;
                            }

                            // Handler is enabled
                            if (!handler.enabled) continue;

                            // Add handler to corresponding (match regex) group
                            const name =
                                "name" in handler.data
                                    ? handler.data.name
                                    : "custom_id" in handler.data
                                    ? handler.data.custom_id
                                    : "commandName" in handler.data
                                    ? handler.data.commandName
                                    : undefined;

                            if (!name) {
                                this.client.logger.warn(
                                    `Unable to obtain name or custom_id, skipping handler file: ${item}`
                                );
                                return;
                            }

                            this.groupedHandlers[p.name as GroupKeys][name] =
                                handler;

                            if ("matchRegex" in handler && handler.matchRegex) {
                                this.groupedMatchRegex[
                                    p.name as GroupKeys
                                ].push({
                                    regex: handler.matchRegex,
                                    handlerName: name
                                });
                            }

                            // Log loaded message
                            this.client.logger.debug(
                                `[InteractionLoader] ${
                                    p.name.charAt(0).toUpperCase() +
                                    p.name.substring(1)
                                }: ${item} handler loaded`
                            );
                        }
                    } catch (err) {
                        this.client.logger.error(
                            `Error while trying to load handler file ${item}`,
                            err
                        );
                    }
                }
            }
        };

        await loadHandlers(p.folderDir);
    }

    public getHandler(i: Interaction): HandlerTypes | undefined {
        const getHandlerByMatchRegex = (
            i: Interaction,
            group: GroupKeys
        ): HandlerTypes | undefined => {
            const name = i.isCommand()
                ? i.commandName
                : i.isMessageComponent() || i.isModalSubmit()
                ? i.customId
                : undefined;
            if (!name) {
                this.client.logger.warn(
                    "Interaction handler was unable to obtain the name from a interaction"
                );
                return;
            }

            const result = this.groupedMatchRegex[group].find(i =>
                i.regex.test(name)
            );
            if (!result) return;

            return this.groupedHandlers[group][result.handlerName];
        };

        if (i.isAutocomplete()) {
            const handler = this.groupedHandlers.autocomplete[i.commandName];
            if (!handler) return getHandlerByMatchRegex(i, "autocomplete");
            return handler;
        } else if (i.isButton()) {
            const handler = this.groupedHandlers.buttonComponents[i.customId];
            if (!handler) return getHandlerByMatchRegex(i, "buttonComponents");
            return handler;
        } else if (i.isChatInputCommand()) {
            const handler =
                this.groupedHandlers.chatInputCommands[i.commandName];
            if (!handler) return getHandlerByMatchRegex(i, "chatInputCommands");
            return handler;
        } else if (i.isMessageContextMenuCommand()) {
            const handler =
                this.groupedHandlers.messageContextMenuCommands[i.commandName];
            if (!handler)
                return getHandlerByMatchRegex(i, "messageContextMenuCommands");
            return handler;
        } else if (i.isModalSubmit()) {
            const handler = this.groupedHandlers.modals[i.customId];
            if (!handler) return getHandlerByMatchRegex(i, "modals");
            return handler;
        } else if (i.isStringSelectMenu()) {
            const handler =
                this.groupedHandlers.stringSelectMenuComponents[i.customId];
            if (!handler)
                return getHandlerByMatchRegex(i, "stringSelectMenuComponents");
            return handler;
        } else if (i.isUserSelectMenu()) {
            const handler =
                this.groupedHandlers.userSelectMenuComponents[i.customId];
            if (!handler)
                return getHandlerByMatchRegex(i, "userSelectMenuComponents");
            return handler;
        } else if (i.isRoleSelectMenu()) {
            const handler =
                this.groupedHandlers.roleSelectMenuComponents[i.customId];
            if (!handler)
                return getHandlerByMatchRegex(i, "roleSelectMenuComponents");
            return handler;
        } else if (i.isMentionableSelectMenu()) {
            const handler =
                this.groupedHandlers.mentionableSelectMenuComponents[
                    i.customId
                ];
            if (!handler)
                return getHandlerByMatchRegex(
                    i,
                    "mentionableSelectMenuComponents"
                );
            return handler;
        } else if (i.isChannelSelectMenu()) {
            const handler =
                this.groupedHandlers.channelSelectMenuComponents[i.customId];
            if (!handler)
                return getHandlerByMatchRegex(i, "channelSelectMenuComponents");
            return handler;
        } else if (i.isUserContextMenuCommand()) {
            const handler =
                this.groupedHandlers.userContextMenuCommands[i.commandName];
            if (!handler)
                return getHandlerByMatchRegex(i, "userContextMenuCommands");
            return handler;
        } else {
            return;
        }
    }

    public async handleInteractionCreate(i: Interaction): Promise<void> {
        const handler = this.getHandler(i);
        if (!handler) return;

        /**
         * Really tried to prevent just ignoring the type issue below,
         * But I spent far too long on it and couldn't figure out a good clean way
         *
         * The only way I found was by placing the getHandler function inside here
         * and then calling the run function and checking options in each if statement,
         * and it looks really messy so decided to go with ignore comments as the types
         * are actually already checked by the getHandler function when getting the handler
         *
         * - Jarco
         */
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await handler.run(i);
    }

    public async updateApplicationCommands(): Promise<void> {
        // Client is ready
        await this.client.application?.fetch();
        if (!this.client.isReady() || !this.client.application) {
            this.client.logger.warn(
                "You can't call the InteractionLoader#updateApplicationCommands method before the client is ready!"
            );
            return;
        }

        // Gather command data
        const globalCommands: ApplicationCommandDataResolvable[] = [];

        const addCommand = (
            command:
                | ChatInputCommand
                | MessageContextMenuCommand
                | UserContextMenuCommand
        ) => {
            if (!command.enabled) return;
            globalCommands.push(command.data);
        };

        for (const key in this.groupedHandlers.chatInputCommands) {
            addCommand(this.groupedHandlers.chatInputCommands[key]);
        }
        for (const key in this.groupedHandlers.messageContextMenuCommands) {
            addCommand(this.groupedHandlers.messageContextMenuCommands[key]);
        }
        for (const key in this.groupedHandlers.userContextMenuCommands) {
            addCommand(this.groupedHandlers.userContextMenuCommands[key]);
        }

        // Create commands
        this.client.application.commands
            .set(globalCommands)
            .then(commands => {
                this.client.logger.info(
                    `[InteractionLoader] Updated ${commands.size} global application command(s)`
                );
            })
            .catch(err => {
                this.client.logger.error(
                    "Error while updating global application command(s)",
                    err
                );
            });
    }
}
