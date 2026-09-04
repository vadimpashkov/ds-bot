import { ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder } from "discord.js";

export function buildVoiceControlComponents(channelId: string) {
	const toggleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`voice:toggle:${channelId}`)
			.setLabel("🔒 Сделать приватным")
			.setStyle(ButtonStyle.Secondary),
	);

	const inviteRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
		new UserSelectMenuBuilder()
			.setCustomId(`voice:invite:${channelId}`)
			.setPlaceholder("Пригласить участников")
			.setMinValues(1)
			.setMaxValues(10),
	);

	return [toggleRow, inviteRow];
}
