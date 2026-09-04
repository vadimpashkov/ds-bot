import { ChannelType } from "discord.js";
import { deleteTempVoiceChannel, findAllTempVoiceChannels } from "@/db/temp-voice-channels";
import { logger } from "@/logger";
import type { Client } from "@/module/client";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 минут

export async function cleanupEmptyTempVoiceChannels(client: Client): Promise<void> {
	const tempVoiceChannels = await findAllTempVoiceChannels();

	for (const tempVoice of tempVoiceChannels) {
		try {
			const channel = await client.channels.fetch(tempVoice.channelId).catch(() => null);

			if (!channel) {
				await deleteTempVoiceChannel(tempVoice.channelId);
				logger.info({ channelId: tempVoice.channelId }, "Удалена запись о несуществующем временном канале");
				continue;
			}

			if (channel.type !== ChannelType.GuildVoice) {
				continue;
			}

			if (channel.members.size === 0) {
				await channel.delete();
				await deleteTempVoiceChannel(tempVoice.channelId);
				logger.info({ channelId: tempVoice.channelId }, "Удалён пустой временный голосовой канал");
			}
		} catch (error) {
			logger.error({ error, channelId: tempVoice.channelId }, "Ошибка при очистке временного голосового канала");
		}
	}
}

export function startVoiceChannelCleanupJob(client: Client): NodeJS.Timeout {
	void cleanupEmptyTempVoiceChannels(client);

	return setInterval(() => {
		void cleanupEmptyTempVoiceChannels(client);
	}, CLEANUP_INTERVAL_MS);
}
