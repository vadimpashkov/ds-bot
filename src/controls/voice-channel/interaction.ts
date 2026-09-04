import { ChannelType, type Interaction, MessageFlags } from "discord.js";
import { findTempVoiceChannel, setTempVoiceChannelPrivacy } from "@/db/temp-voice-channels";
import { logger } from "@/logger";
import { sendVoiceInvite } from "./invite-link";
import { inviteUsersToChannel, lockChannel, unlockChannel } from "./permissions";

// REMARK: customId кнопок/меню собран как "voice:action:channelId".
export const voiceControlInteractionHandler = async (interaction: Interaction): Promise<void> => {
	if (!interaction.isButton() && !interaction.isUserSelectMenu()) {
		return;
	}

	const [namespace, action, channelId] = interaction.customId.split(":");
	if (namespace !== "voice") {
		return;
	}

	const channel = interaction.guild?.channels.cache.get(channelId);
	if (!channel || channel.type !== ChannelType.GuildVoice) {
		await interaction.reply({
			content: "Этого канала уже не существует.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const tempVoice = await findTempVoiceChannel(channelId);
	if (!tempVoice || tempVoice.ownerId !== interaction.user.id) {
		await interaction.reply({
			content: "Управлять этим каналом может только его владелец.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	try {
		if (action === "toggle") {
			if (tempVoice.isPrivate) {
				await unlockChannel(channel);
				await setTempVoiceChannelPrivacy(channelId, false);
				await interaction.reply({ content: "🔓 Канал снова публичный.", flags: MessageFlags.Ephemeral });
			} else {
				await lockChannel(channel);
				await setTempVoiceChannelPrivacy(channelId, true);
				await interaction.reply({
					content: "🔒 Канал стал приватным - зайти смогут только приглашённые.",
					flags: MessageFlags.Ephemeral,
				});
			}
			return;
		}

		if (action === "invite" && interaction.isUserSelectMenu()) {
			// Discord не дает исключить себя из списка на уровне самого меню - фильтруем уже после выбора.
			const selectedUsers = interaction.users.filter((user) => user.id !== interaction.user.id);

			if (selectedUsers.size === 0) {
				await interaction.reply({
					content: "Нельзя пригласить самого себя - ты и так внутри канала.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await inviteUsersToChannel(channel, [...selectedUsers.keys()]);

			const { invited, failedDm } = await sendVoiceInvite(channel, selectedUsers);

			const parts: string[] = [];
			if (invited.length > 0) {
				parts.push(`Приглашение отправлено в личные сообщения: ${invited.map((id) => `<@${id}>`).join(", ")}`);
			}
			if (failedDm.length > 0) {
				parts.push(
					`Не смог написать в личку (закрыты ЛС): ${failedDm.map((id) => `<@${id}>`).join(", ")} - но доступ к каналу у них уже есть.`,
				);
			}

			await interaction.reply({ content: parts.join("\n"), flags: MessageFlags.Ephemeral });
		}
	} catch (error) {
		logger.error({ error, channelId, action }, "Ошибка при управлении приватностью голосового канала");
		await interaction.reply({
			content: "Что-то пошло не так, попробуй ещё раз.",
			flags: MessageFlags.Ephemeral,
		});
	}
};
