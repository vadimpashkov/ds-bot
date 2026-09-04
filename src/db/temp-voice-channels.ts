import { pool } from "@/db";
import type { CamelToSnakeKeys } from "@/shared/types/utils";

export interface TempVoiceChannel {
	channelId: string;
	guildId: string;
	ownerId: string;
	isPrivate: boolean;
	isInvisible: boolean;
}

type TempVoiceChannelRow = CamelToSnakeKeys<TempVoiceChannel>;

export async function createTempVoiceChannel(data: Omit<TempVoiceChannel, "isPrivate" | "isInvisible">): Promise<void> {
	await pool.query("INSERT INTO temp_voice_channels (channel_id, guild_id, owner_id) VALUES ($1, $2, $3)", [
		data.channelId,
		data.guildId,
		data.ownerId,
	]);
}

function mapRow(row: TempVoiceChannelRow): TempVoiceChannel {
	return {
		channelId: row.channel_id,
		guildId: row.guild_id,
		ownerId: row.owner_id,
		isPrivate: row.is_private,
		isInvisible: row.is_invisible,
	};
}

export async function findTempVoiceChannel(channelId: string): Promise<TempVoiceChannel | null> {
	const result = await pool.query<TempVoiceChannelRow>(
		"SELECT channel_id, guild_id, owner_id, is_private, is_invisible FROM temp_voice_channels WHERE channel_id = $1",
		[channelId],
	);

	const row = result.rows[0];
	return row ? mapRow(row) : null;
}

export async function findAllTempVoiceChannels(): Promise<TempVoiceChannel[]> {
	const result = await pool.query<TempVoiceChannelRow>(
		"SELECT channel_id, guild_id, owner_id, is_private, is_invisible FROM temp_voice_channels",
	);

	return result.rows.map(mapRow);
}

export async function setTempVoiceChannelOwnerId(channelId: string, ownerId: string): Promise<void> {
	await pool.query("UPDATE temp_voice_channels SET owner_id = $2 WHERE channel_id = $1", [channelId, ownerId]);
}

export async function setTempVoiceChannelPrivacy(channelId: string, isPrivate: boolean): Promise<void> {
	await pool.query("UPDATE temp_voice_channels SET is_private = $2 WHERE channel_id = $1", [channelId, isPrivate]);
}

export async function setTempVoiceChannelInvisible(channelId: string, isInvisible: boolean): Promise<void> {
	await pool.query("UPDATE temp_voice_channels SET is_invisible = $2 WHERE channel_id = $1", [
		channelId,
		isInvisible,
	]);
}

export async function deleteTempVoiceChannel(channelId: string): Promise<void> {
	await pool.query("DELETE FROM temp_voice_channels WHERE channel_id = $1", [channelId]);
}
