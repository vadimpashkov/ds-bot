import { ChannelType, type Message, PermissionFlagsBits, type VoiceBasedChannel, type VoiceState } from "discord.js";
import { buildVoiceControlComponents } from "@/controls/voice-channel";
import {
	createTempVoiceChannel,
	deleteTempVoiceChannel,
	findTempVoiceChannel,
	setTempVoiceChannelOwnerId,
} from "@/db/temp-voice-channels";
import { logger } from "@/logger";

const MIN_VOICE_BITRATE = 8000;
const CREATOR_CHANNEL_NAME = "➕・Создать комнату";
const NEW_OWNER_DELAY_MS = 1000 * 60 * 3; // 3 минуты

const newOwnerTimers = new Map<string, NodeJS.Timeout>();
const controlsMessages = new Map<string, Message<true>>();

const getWelcomeMessage = (ownerMention: string) =>
	`${ownerMention} - это твоя комната.\nТы можешь ее настроить под себя, а также пригласить или исключить участников.`;

export const voiceStateUpdateHandler = async (oldState: VoiceState, newState: VoiceState) => {
	const member = newState.member;
	if (!member || member.user.bot) {
		return;
	}

	await handleChannelCreate(newState);
	await handleChannelLeave(oldState);
};

async function handleChannelCreate(state: VoiceState) {
	const { channel, guild, member } = state;
	if (!channel || !member) {
		return;
	}

	if (channel.bitrate === MIN_VOICE_BITRATE && channel.name === CREATOR_CHANNEL_NAME) {
		try {
			const categoryOverwrites = channel.parent?.permissionOverwrites.cache.values() ?? [];

			const createdChannel = await guild.channels.create({
				name: `🎙️・${member.displayName}`,
				type: ChannelType.GuildVoice,
				parent: channel.parentId,
				userLimit: channel.userLimit,
				bitrate: 64000,
				permissionOverwrites: [
					...categoryOverwrites,
					{
						id: member.id,
						allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
					},
				],
			});

			await createTempVoiceChannel({
				channelId: createdChannel.id,
				guildId: guild.id,
				ownerId: member.id,
			});

			const controlMessage = await createdChannel.send({
				content: getWelcomeMessage(`${member}`),
				components: buildVoiceControlComponents(createdChannel.id),
			});

			controlsMessages.set(createdChannel.id, controlMessage);
			await member.voice.setChannel(createdChannel);
		} catch (error) {
			logger.error({ error }, "Ошибка при создании временной голосовой комнаты");
		}
	}
}

async function handleChannelLeave(state: VoiceState) {
	const { channel } = state;
	if (!channel) {
		return;
	}

	const tempVoice = await findTempVoiceChannel(channel.id);
	if (!tempVoice) {
		return;
	}

	if (channel.members.size === 0) {
		try {
			const activeTimer = newOwnerTimers.get(channel.id);
			if (activeTimer) {
				clearTimeout(activeTimer);
				newOwnerTimers.delete(channel.id);
			}

			controlsMessages.delete(channel.id);

			await channel.delete();
			await deleteTempVoiceChannel(channel.id);
		} catch (error) {
			logger.error({ error }, "Ошибка при удалении временной голосовой комнаты");
		}
	} else {
		setNewOwner(channel);
	}
}

function setNewOwner(channel: VoiceBasedChannel): void {
	const currentTimer = newOwnerTimers.get(channel.id);
	if (currentTimer) {
		clearTimeout(currentTimer);
	}

	const timer = setTimeout(async () => {
		newOwnerTimers.delete(channel.id);

		try {
			const nextOwner = channel.members.first();
			if (!nextOwner) {
				controlsMessages.delete(channel.id);
				return;
			}

			await setTempVoiceChannelOwnerId(channel.id, nextOwner.id);

			const controlMessage = controlsMessages.get(channel.id);
			if (!controlMessage) {
				return;
			}

			await controlMessage.edit({
				content: getWelcomeMessage(`${nextOwner}`),
				components: buildVoiceControlComponents(channel.id),
			});
		} catch (error) {
			logger.error({ error, channelId: channel.id }, "Ошибка при смене владельца комнаты");
		}
	}, NEW_OWNER_DELAY_MS);

	newOwnerTimers.set(channel.id, timer);
}
