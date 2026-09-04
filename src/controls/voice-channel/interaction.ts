import { ChannelType, type Interaction, MessageFlags } from "discord.js";
import { findTempVoiceChannel } from "@/db/temp-voice-channels";
import { logger } from "@/logger";
import { buildVoiceControlComponents, buildVoiceControlModal } from "./components";
import { sendVoiceInvite } from "./invite-link";
import { inviteUsersToChannel, kickUsersFromChannel } from "./permissions";

// REMARK: customId кнопок/меню собран как "voice:action:channelId:noise".
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
		if (action === "settings") {
			const modal = buildVoiceControlModal(channelId, {
				channelName: channel.name.split("・")[1],
				userLimit: channel.userLimit,
				isPrivate: tempVoice.isPrivate,
				isInvisible: tempVoice.isInvisible,
			});
			await interaction.showModal(modal);
			return;
		}

		if (action === "invite" && interaction.isUserSelectMenu()) {
			// Discord не дает исключить кого-либо из списка на уровне самого меню - фильтруем уже после выбора.
			const selectedUsers = interaction.users.filter((user) => !channel.members.has(user.id));

			if (selectedUsers.size === 0) {
				await interaction.reply({
					content: "Нельзя пригласить участников, что уже находятся в канале.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await inviteUsersToChannel(channel, [...selectedUsers.keys()]);

			const { invited, failedDm } = await sendVoiceInvite(
				channel,
				interaction.user.globalName ?? interaction.user.username,
				selectedUsers,
			);

			const parts: string[] = [];
			if (invited.length > 0) {
				parts.push(`Приглашение отправлено в личные сообщения: ${invited.map((id) => `<@${id}>`).join(", ")}`);
			}
			if (failedDm.length > 0) {
				parts.push(
					`Не смог отправить приглашения в личные сообщение (закрыты ЛС): ${failedDm.map((id) => `<@${id}>`).join(", ")} - но доступ к каналу у них уже есть.`,
				);
			}

			// REMARK: Перерисовываем контроллеры, чтобы очистить кеш у самого Discord
			if (interaction.message) {
				await interaction.message.edit({
					components: buildVoiceControlComponents(channelId),
				});
			}

			await interaction.reply({ content: parts.join("\n"), flags: MessageFlags.Ephemeral });
		}

		if (action === "kick" && interaction.isUserSelectMenu()) {
			// Discord не дает исключить себя из списка на уровне самого меню - фильтруем уже после выбора.
			const selectedUsers = interaction.users.filter((user) => user.id !== interaction.user.id);

			if (selectedUsers.size === 0) {
				await interaction.reply({
					content: "Нельзя выгнать самого себя.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			await kickUsersFromChannel(channel, [...selectedUsers.keys()]);

			if (interaction.message) {
				await interaction.message.edit({
					components: buildVoiceControlComponents(channelId),
				});
			}

			await interaction.reply({
				content: `Участники ${selectedUsers.map((id) => id).join(", ")} были исключены из канала и больше не смогут в него войти (чтобы они смогли войти вновь - пригласите их).`,
				flags: MessageFlags.Ephemeral,
			});
		}
	} catch (error) {
		logger.error({ error, channelId, action }, "Ошибка при управлении голосовым каналом");
		await interaction.reply({
			content: "Что-то пошло не так, попробуй ещё раз.",
			flags: MessageFlags.Ephemeral,
		});
	}
};
