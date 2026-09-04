import { OverwriteType, PermissionFlagsBits, type VoiceChannel } from "discord.js";
import { isStaffRole } from "@/shared/utils/is-staff-role";

export async function lockChannel(channel: VoiceChannel): Promise<void> {
	await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { Connect: false });

	const overwrites = [...channel.permissionOverwrites.cache.values()];
	for (const overwrite of overwrites) {
		if (overwrite.type !== OverwriteType.Role) {
			continue;
		}

		if (overwrite.id === channel.guild.roles.everyone.id) {
			continue;
		}

		if (isStaffRole(overwrite.id)) {
			continue;
		}

		if (!overwrite.allow.has(PermissionFlagsBits.Connect)) {
			continue;
		}

		await channel.permissionOverwrites.edit(overwrite.id, { Connect: false });
	}
}

export async function unlockChannel(channel: VoiceChannel): Promise<void> {
	await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { Connect: null });

	const overwrites = [...channel.permissionOverwrites.cache.values()];
	for (const overwrite of overwrites) {
		if (overwrite.type !== OverwriteType.Role) {
			continue;
		}

		if (overwrite.id === channel.guild.roles.everyone.id) {
			continue;
		}

		if (isStaffRole(overwrite.id)) {
			continue;
		}

		if (!overwrite.deny.has(PermissionFlagsBits.Connect)) {
			continue;
		}

		await channel.permissionOverwrites.edit(overwrite.id, { Connect: null });
	}
}

export async function inviteUsersToChannel(channel: VoiceChannel, userIds: string[]): Promise<void> {
	for (const userId of userIds) {
		await channel.permissionOverwrites.edit(userId, {
			Connect: true,
			ViewChannel: true,
		});
	}
}
