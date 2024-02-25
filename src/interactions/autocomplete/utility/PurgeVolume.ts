import { HandlerResult } from "@/types";
import { Autocomplete } from "@/structures";
import { AutocompleteInteraction } from "discord.js";

export default class PurgeVolumeAutocomplete extends Autocomplete {
    constructor() {
        super({
            commandName: "purge-volume"
        });
    }

    public async run(i: AutocompleteInteraction): Promise<HandlerResult> {
        const option = i.options.getFocused(true);

        // Get the options
        switch (`${i.options.getSubcommand(true)}.${option.name}`) {
            case "add.from":
            case "add.to":
            case "view-multiple.filament-1":
            case "view-multiple.filament-2":
            case "view-multiple.filament-3":
            case "view-multiple.filament-4": {
                const filaments = await this.client.prisma.filaments.findMany({
                    where: { name: { contains: option.value } },
                    select: { id: true, name: true }
                });

                i.respond(
                    filaments.map(f => ({
                        name: f.name,
                        value: f.id.toString()
                    }))
                );
                return { result: "SUCCESS" };
            }

            case "add.nozzle":
            case "view-multiple.nozzle": {
                const nozzles = await this.client.prisma.nozzles.findMany({
                    where: { name: { contains: option.value } },
                    select: { id: true, name: true }
                });

                i.respond(
                    nozzles.map(f => ({ name: f.name, value: f.id.toString() }))
                );
                return { result: "SUCCESS" };
            }

            case "remove.purge-volume":
            case "view.purge-volume": {
                const purgeVolumes =
                    await this.client.prisma.filamentPurgeVolumes.findMany({
                        where: { name: { contains: option.value } },
                        select: { id: true, name: true }
                    });

                i.respond(
                    purgeVolumes.map(f => ({
                        name: f.name,
                        value: f.id.toString()
                    }))
                );
                return { result: "SUCCESS" };
            }
        }

        // Sub command not found
        return {
            result: "ERRORED",
            note: "Subcommand autocomplete executor not found",
            error: new Error("missing executor")
        };
    }
}
