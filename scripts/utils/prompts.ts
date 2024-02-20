import inquirer from "inquirer";

/**
 * Inquirer prompt where users write their selection
 * @param message Message to prompt to user
 * @param optional Whether the user should be allowed to provide no input
 * @param filter Input filter to pass to inquirer
 * @returns
 */
export async function promptInput(
    message: string,
    optional: boolean,
    filter?: (input: any) => Promise<string>
): Promise<string> {
    return (
        await inquirer.prompt({
            type: "input",
            message,
            name: "response",
            filter:
                filter && !optional
                    ? filter
                    : (input: any): Promise<string> => {
                          return new Promise((res, rej) => {
                              if (input.length > 0 || optional) {
                                  res(input);
                              } else rej("Value may not be empty");
                          });
                      }
        })
    ).response;
}

/**
 * Inquirer prompt where users select from a list
 * @param message Message to prompt to user
 * @param choices String array of choices to prompt to user
 * @param optional Whether the user should be allowed to provide no input
 * @param filter Input filter to pass to inquirer
 * @returns
 */
export async function promptList(
    message: string,
    choices: string[],
    optional: boolean,
    filter?: (input: any) => Promise<string>
): Promise<string> {
    return (
        await inquirer.prompt([
            {
                type: "list",
                message,
                choices,
                name: "response",
                filter:
                    filter && !optional
                        ? filter
                        : (input: any): Promise<string> => {
                              return new Promise((res, rej) => {
                                  if (input.length > 0 || optional) {
                                      res(input);
                                  } else rej("Must select at least one");
                              });
                          }
            }
        ])
    ).response;
}

/**
 * Inquirer prompt where users select yes or no
 * @param message Message to prompt to user
 * @param filter Input filter to pass to inquirer
 * @returns
 */
export async function promptConfirm(
    message: string,
    filter?: (input: any) => Promise<string>
): Promise<boolean> {
    return (
        await inquirer.prompt([
            {
                type: "confirm",
                message,
                name: "response",
                filter
            }
        ])
    ).response;
}

/**
 * Inquirer prompt where users are able to select multiple from a list
 * @param message Message to prompt to user
 * @param choices String array of choices to prompt to user
 * @param optional Whether the user should be allowed to provide no input
 * @param filter Input filter to pass to inquirer
 * @returns
 */
export async function promptCheckbox(
    message: string,
    choices: string[],
    optional: boolean,
    filter?: (input: any) => Promise<string>
): Promise<string[]> {
    return (
        await inquirer.prompt([
            {
                type: "checkbox",
                message,
                name: "response",
                choices,
                filter:
                    filter && !optional
                        ? filter
                        : (input: any): Promise<string> => {
                              return new Promise((res, rej) => {
                                  if (input.length > 0 || optional) {
                                      res(input);
                                  } else rej("Must select at least one");
                              });
                          }
            }
        ])
    ).response;
}

/**
 * Inquirer prompt where users enter a hidden password
 * @param message Message to prompt to user
 * @param optional Whether the user should be allowed to provide no input
 * @param filter Input filter to pass to inquirer
 * @returns
 */
export async function promptPassword(
    message: string,
    optional: boolean,
    filter?: (input: any) => Promise<string>
): Promise<string> {
    return (
        await inquirer.prompt([
            {
                type: "password",
                message,
                name: "response",
                mask: "*",
                filter:
                    filter && !optional
                        ? filter
                        : (input: any): Promise<string> => {
                              return new Promise((res, rej) => {
                                  if (input.length > 0 || optional) {
                                      res(input);
                                  } else rej("Must select at least one");
                              });
                          }
            }
        ])
    ).response;
}
