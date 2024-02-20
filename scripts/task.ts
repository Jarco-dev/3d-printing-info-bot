import * as handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { isValidCron } from "cron-validator";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { promptInput } from "./utils/prompts";

const selections = new Map();

(async () => {
    // Set directory
    const handlerDir = path.resolve(process.cwd(), "src", "tasks");
    if (!fs.existsSync(handlerDir)) {
        fs.mkdirSync(handlerDir);
    }
    selections.set("dir", handlerDir);

    // Collect cron expression
    selections.set(
        "cronExpression",
        await promptInput(
            "Cron expression, must follow cron syntax",
            false,
            (input: string) => {
                return new Promise((res, rej) => {
                    if (isValidCron(input)) {
                        res(input);
                    } else {
                        rej("Invalid cron expression");
                    }
                });
            }
        )
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
    console.log("\nCreating task file...");

    const template = handlebars.compile(
        fs
            .readFileSync(
                path.resolve(process.cwd(), "scripts", "templates", "task.hbs")
            )
            .toString(),
        { noEscape: true }
    );

    const getName = (caseType: "camelCase" | "pascalCase"): string => {
        const name: string = selections.get("fileName").replace(".ts", "");
        if (caseType === "pascalCase") {
            return name;
        } else {
            return (
                name.charAt(0).toLowerCase() + name.substring(1, name.length)
            );
        }
    };

    const compiled = template({
        className: getName("pascalCase"),
        name: getName("camelCase"),
        cronExpression: selections.get("cronExpression")
    });

    fs.writeFileSync(filePath, compiled);

    // Format task file
    try {
        execSync(`npx eslint ${filePath} --fix`);
    } catch (e) {
        console.log("\nFailed to format new task file");
        return;
    }

    // Done
    console.log("\nTask created\n");
})();
