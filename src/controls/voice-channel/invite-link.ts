import type { Collection, User, VoiceChannel } from "discord.js";
import { logger } from "@/logger";

export interface SendVoiceInviteResult {
	invited: string[];
	failedDm: string[];
}

export async function sendVoiceInvite(
	channel: VoiceChannel,
	channelOwnerName: string,
	users: Collection<string, User>,
): Promise<SendVoiceInviteResult> {
	const invite = await channel.createInvite({ maxAge: 0, unique: true });

	const invited: string[] = [];
	const failedDm: string[] = [];

	for (const user of users.values()) {
		try {
			await user.send(
				`**${channelOwnerName}** приглашает тебя в голосовой канал **${channel.name}**: ${invite.url}`,
			);
			invited.push(user.id);
		} catch (error) {
			// Частый случай - у человека закрыты личные сообщения от не-друзей.
			// Доступ к каналу у него уже есть, просто ссылку он получит не от нас.
			logger.warn({ error, userId: user.id }, "Не удалось отправить приглашение в личные сообщения");
			failedDm.push(user.id);
		}
	}

	return { invited, failedDm };
}
