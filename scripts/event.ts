import * as handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getDirs } from "./utils/getDirs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { promptInput, promptList } from "./utils/prompts";

const selections = new Map();

(async () => {
    // Get events folder
    const handlerDir = path.resolve(process.cwd(), "src", "events");
    if (!fs.existsSync(handlerDir)) {
        fs.mkdirSync(handlerDir);
    }

    // Collect directory
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

    selections.set("dir", path.resolve(handlerDir, dirInput));

    // Collect event
    selections.set(
        "event",
        await promptInput("Event name, must use camelCase:", false)
    );

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
        selections.get("dir"),
        selections.get("fileName")
    );

    // Create the event file
    console.log("\nCreating event file...");

    const template = handlebars.compile(
        fs
            .readFileSync(
                path.resolve(process.cwd(), "scripts", "templates", "event.hbs")
            )
            .toString(),
        { noEscape: true }
    );

    const getName = (): string => {
        return selections.get("fileName").replace(".ts", "");
    };

    const compiled = template({
        name: getName(),
        event: selections.get("event")
    });

    fs.writeFileSync(filePath, compiled);

    // Format event file
    try {
        execSync(`npx eslint ${filePath} --fix`);
    } catch (e) {
        console.log("\nFailed to format new event file");
        return;
    }

    // Done
    console.log(
        "\nEvent created, Please add the parameters for the run method manually\n"
    );
})();
