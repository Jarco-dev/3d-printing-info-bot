import { HandlerResult } from "@/types";
import { Autocomplete } from "@/structures";
import { AutocompleteInteraction } from "discord.js";

export default class FilamentAutocomplete extends Autocomplete {
    constructor() {
        super({
            commandName: "filament"
        });
    }

    public async run(i: AutocompleteInteraction): Promise<HandlerResult> {
        const value = i.options.getFocused();

        // Fetch and send values
        const options = await this.client.prisma.filaments.findMany({
            where: { name: { contains: value } },
            select: { id: true, name: true }
        });

        i.respond(options.map(o => ({ name: o.name, value: o.id.toString() })));

        // Success
        return { result: "SUCCESS" };
    }
}
