import { Events, GatewayIntentBits, Partials } from "discord.js";
import { config } from "@/config";
import { startVoiceChannelCleanupJob } from "@/controls/voice-channel";
import { closeDb } from "@/db";
import { logger } from "@/logger";
import { Client } from "@/module/client";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Channel],
});

let cleanupInterval: NodeJS.Timeout | undefined;

client.once(Events.ClientReady, (readyClient) => {
	logger.info({ tag: readyClient.user.tag }, "Бот запущен");
	client.start();
	cleanupInterval = startVoiceChannelCleanupJob(client);
});

async function shutdown(signal: string): Promise<void> {
	logger.info({ signal }, "Получен сигнал остановки, завершаю работу...");

	client.destroy();
	await closeDb();

	clearInterval(cleanupInterval);

	process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
	logger.error(reason, "Необработанный rejected promise");
});

client.init(config.DISCORD_TOKEN);
