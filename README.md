# bot-layout-ts

A basic layout for a discord bot using typescript

# To do before starting development

* Enter a name, version and description in `package.json`
* In `.env.example` fill in the config values
* Remove `.example` from `.env.example`
* Remove unneeded intents in `src/config.ts`
* install npm packages using `npm i`
* Update the `README.md` to fit the project

--------------------------------------------------------------

# bot-layout-ts

The bot-layout-ts discord bot

# Compiling

* Open a terminal and navigate to the bots folder
* Run `npm install` to install dependencies
* Run `npm build` to compile the bot
* The bot will be compiled into ./dist/src

# Installation

* In `.env.example` fill in the config values
* Remove `.example` from `.env.example`
* Open a terminal and navigate to the bots folder
* Execute `npm install --production` and wait till it's done
* Execute `prisma migrate deploy` and wait till it's done
* Execute `prisma generate` and wait till it's done
* You're ready to start the bot!

# Starting

* Open a terminal and navigate to the bots folder
* Run `npm run start` and the bot should log in
* The bot is now ready for use

# Npm commands
* `npm run lint` Lint the entire project
* `npm run fix` Fix the project according to the linter
* `npm run build` Build both the bot and scripts
* `npm run start` Start the compiled bot
* `npm run dev` Start the bot and watch for changes
* `npm run new:task` Create a new task file
* `npm run new:event` Create a new event handler file
* `npm run new:interaction` Create a new interaction file

