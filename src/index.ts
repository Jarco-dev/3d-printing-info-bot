import { Client } from "@/classes";

const client = new Client();
export default client;

// Fix console being ugly on pterodactyl
console.log("\n");

// Authorise the bot
client.logger.info("Connecting to discord...");
client.login(client.sConfig.DISCORD_BOT_TOKEN);

// Catch any uncaught errors
process.on("uncaughtException", err => {
    client.logger.error("Uncaught exception in process#uncaughtException", err);
});

process.on("unhandledRejection", err => {
    client.logger.error(
        "Unhandled rejection in process#unhandledRejection",
        err
    );
});
