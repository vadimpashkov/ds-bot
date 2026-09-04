import {
	type ChatInputCommandInteraction,
	DiscordAPIError,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { config } from "@/config";
import { logger } from "@/logger";
import { isOwner } from "@/shared/utils/is-owner";
import type { Command } from "./types";

const BULK_DELETE_LIMIT = 100;
const MAX_FULL_CLEAR_BATCHES = 200;

export const clearChatCommand: Command<ChatInputCommandInteraction> = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Очистить сообщения в текстовом канале")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption((opt) =>
			opt
				.setName("количество")
				.setDescription("Сколько сообщений удалить (1–100)")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(100),
		),

	async execute(interaction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				content: "❌ Эту команду можно использовать только на сервере.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const hasAdminRole = interaction.member.roles.cache.has(config.ADMIN_ROLE_ID);
		if (!hasAdminRole && !isOwner(interaction.user.id)) {
			await interaction.reply({
				content: "⛔ У вас нет нужной роли для выполнения этой команды.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const channel = interaction.channel;
		if (!channel?.isTextBased() || channel.isDMBased() || !("bulkDelete" in channel)) {
			await interaction.reply({
				content: "❌ Эту команду можно использовать только в текстовых каналах сервера (включая треды).",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const amount = interaction.options.getInteger("количество");
		const clearAll = amount === null;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			if (clearAll) {
				const totalDeleted = await deleteAllMessages(channel);
				await interaction.editReply(
					totalDeleted > 0
						? `✅ Канал очищен. Удалено сообщений: **${totalDeleted}**.`
						: "❌ Не удалось удалить сообщения - либо канал уже пуст, либо все сообщения в нём старше 14 дней.",
				);
				return;
			}

			const deleted = await channel.bulkDelete(amount as number, true);

			if (deleted.size === 0) {
				await interaction.editReply(
					"❌ Не удалось удалить сообщения. Возможно, все сообщения в канале старше 14 дней.",
				);
				return;
			}

			await interaction.editReply(`✅ Удалено сообщений: **${deleted.size}**.`);
		} catch (err) {
			logger.error({ err }, "Ошибка при выполнении команды очистки канала");

			if (err instanceof DiscordAPIError && err.code === 50013) {
				await interaction.editReply(
					"❌ У бота нет прав на управление сообщениями в этом канале (`Manage Messages`).",
				);
				return;
			}

			await interaction.editReply("❌ Произошла ошибка при попытке очистить канал.");
		}
	},
};

async function deleteAllMessages(
	channel: Extract<ChatInputCommandInteraction["channel"], { bulkDelete: unknown }>,
): Promise<number> {
	let total = 0;

	for (let i = 0; i < MAX_FULL_CLEAR_BATCHES; i++) {
		const deleted = await channel.bulkDelete(BULK_DELETE_LIMIT, true);
		total += deleted.size;

		if (deleted.size < BULK_DELETE_LIMIT) {
			break;
		}
	}

	return total;
}
