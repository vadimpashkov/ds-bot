import { type CacheType, ChannelType, MessageFlags, type ModalSubmitInteraction } from "discord.js";
import {
	findTempVoiceChannel,
	setTempVoiceChannelInvisible,
	setTempVoiceChannelPrivacy,
} from "@/db/temp-voice-channels";
import { logger } from "@/logger";
import { hideChannel, lockChannel, showChannel, unlockChannel } from "./permissions";

export const voiceControlModalInteractionHandler = async (
	interaction: ModalSubmitInteraction<CacheType>,
): Promise<void> => {
	if (!interaction.isModalSubmit() || !/voice:settings:\d+/.test(interaction.customId)) {
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
		const checkboxesGroup = interaction.fields.getCheckboxGroup("voice:toggle:private-and-invisible");
		const isPrivateCheckboxValue = checkboxesGroup.includes("voice:toggle:is-private");
		const isInvisibleCheckboxValue = checkboxesGroup.includes("voice:toggle:is-invisible");
		const channelNamePrefix = "🎙️・";
		const channelName = interaction.fields.getTextInputValue("voice:change:channel-name");
		const channelFullName = channelNamePrefix + channelName;
		const userLimit = Number(interaction.fields.getTextInputValue("voice:change:user-limit") ?? 0);

		const replyText: string[] = [];

		if (channel.name !== channelFullName) {
			if (channelName.length >= 3 && channelName.length <= 20) {
				channel.setName(channelFullName);
				replyText.push(`- ✅ Название канала изменено на **${channelName}**`);
			} else {
				replyText.push("- ❌ Введите название канала длиной не больше 20 символов");
			}
		}

		if (channel.userLimit !== userLimit) {
			if (userLimit >= 2 && userLimit <= 99) {
				channel.setUserLimit(userLimit);
				replyText.push(`- ✅ Кол-во слотов канала изменено на **${userLimit}**`);
			} else {
				replyText.push("- ❌ Введите кол-во слотов от 2 до 99");
			}
		}

		if (tempVoice.isPrivate !== isPrivateCheckboxValue) {
			const privateToggleAction = isPrivateCheckboxValue ? lockChannel : unlockChannel;
			await privateToggleAction(channel);
			await setTempVoiceChannelPrivacy(channelId, isPrivateCheckboxValue);
			replyText.push(
				isPrivateCheckboxValue
					? "- 🔒 Канал стал приватным - зайти смогут только приглашённые."
					: "- 🔓 Канал стал публичным.",
			);
		}

		if (tempVoice.isInvisible !== isInvisibleCheckboxValue) {
			const invisibleToggleAction = isInvisibleCheckboxValue ? hideChannel : showChannel;
			await invisibleToggleAction(channel);
			await setTempVoiceChannelInvisible(channelId, isInvisibleCheckboxValue);
			replyText.push(
				isInvisibleCheckboxValue
					? "- 🥷 Канал скрыт от других участников."
					: "- 👁️ Канал виден другим участникам.",
			);
		}

		await interaction.reply({ content: replyText.join("\n"), flags: MessageFlags.Ephemeral });
	} catch (error) {
		logger.error({ error, channelId, action }, "Ошибка при изменении настроек временного голосового канала");
		await interaction.reply({
			content: "Что-то пошло не так, попробуй ещё раз.",
			flags: MessageFlags.Ephemeral,
		});
	}
};
