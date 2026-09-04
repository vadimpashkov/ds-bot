import { ChannelType, PermissionFlagsBits, type VoiceState } from "discord.js";
import { buildVoiceControlComponents } from "@/controls/voice-channel";
import { createTempVoiceChannel, deleteTempVoiceChannel, findTempVoiceChannel } from "@/db/temp-voice-channels";
import { logger } from "@/logger";

const MIN_VOICE_BITRATE = 8000;
const CREATOR_CHANNEL_NAME = "➕・Создать комнату";

export const voiceStateUpdateHandler = async (oldState: VoiceState, newState: VoiceState) => {
	const member = newState.member;
	if (!member || member.user.bot) {
		return;
	}

	const sourceChannel = newState.channel;

	if (sourceChannel && sourceChannel.bitrate === MIN_VOICE_BITRATE && sourceChannel.name === CREATOR_CHANNEL_NAME) {
		try {
			const categoryOverwrites = sourceChannel.parent?.permissionOverwrites.cache.values() ?? [];

			const createdChannel = await sourceChannel.guild.channels.create({
				name: `🎙️・${member.displayName}`,
				type: ChannelType.GuildVoice,
				parent: sourceChannel.parentId,
				userLimit: sourceChannel.userLimit,
				bitrate: 64000,
				permissionOverwrites: [
					...categoryOverwrites,
					{
						id: member.id,
						allow: [
							PermissionFlagsBits.ManageChannels,
							PermissionFlagsBits.MoveMembers,
							PermissionFlagsBits.MuteMembers,
							PermissionFlagsBits.Connect,
							PermissionFlagsBits.Speak,
						],
					},
				],
			});

			await createTempVoiceChannel({
				channelId: createdChannel.id,
				guildId: sourceChannel.guild.id,
				ownerId: member.id,
			});

			await createdChannel.send({
				content: `${member} - это твоя комната. Кнопкой ниже можно сделать её приватной, а через меню - пригласить конкретных людей.`,
				components: buildVoiceControlComponents(createdChannel.id),
			});

			await member.voice.setChannel(createdChannel);
		} catch (error) {
			logger.error({ error }, "Ошибка при создании временной голосовой комнаты");
		}
	}

	if (oldState.channelId) {
		const tempVoice = await findTempVoiceChannel(oldState.channelId);
		if (tempVoice) {
			const oldChannel = oldState.channel;
			if (oldChannel && oldChannel.members.size === 0) {
				try {
					await oldChannel.delete();
					await deleteTempVoiceChannel(oldState.channelId);
				} catch (error) {
					logger.error({ error }, "Ошибка при удалении временной голосовой комнаты");
				}
			}
		}
	}
};
