import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { logger } from "@/logger";
import type { Client } from "@/module/client";

export const interactionCreateHandler = async (interaction: ChatInputCommandInteraction) => {
	const client = interaction.client as Client;
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		logger.error({ commandName: interaction.commandName }, "Принята незарегистрированная команда");
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error(error);

		const sendErrorMessage = interaction.replied || interaction.deferred ? interaction.followUp : interaction.reply;

		await sendErrorMessage({
			content: "При выполнении команды произошла ошибка!",
			flags: MessageFlags.Ephemeral,
		});
	}
};
