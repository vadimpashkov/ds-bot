import { OverwriteType, PermissionFlagsBits, type VoiceChannel } from "discord.js";
import { isStaffRole } from "@/shared/utils/is-staff-role";

type PermissionFlag = typeof PermissionFlagsBits.Connect | typeof PermissionFlagsBits.ViewChannel;

async function updateRolePermissions(
	channel: VoiceChannel,
	permission: PermissionFlag,
	state: false | null,
): Promise<void> {
	const { everyone } = channel.guild.roles;
	const key = permission === PermissionFlagsBits.Connect ? "Connect" : "ViewChannel";

	await channel.permissionOverwrites.edit(everyone.id, { [key]: state });

	const targets = channel.permissionOverwrites.cache.filter((overwrite) => {
		if (overwrite.type !== OverwriteType.Role || overwrite.id === everyone.id || isStaffRole(overwrite.id)) {
			return false;
		}
		return state === null ? overwrite.deny.has(permission) : overwrite.allow.has(permission);
	});

	for (const overwrite of targets.values()) {
		await channel.permissionOverwrites.edit(overwrite.id, { [key]: state });
	}
}

export const lockChannel = (channel: VoiceChannel) =>
	updateRolePermissions(channel, PermissionFlagsBits.Connect, false);

export const unlockChannel = (channel: VoiceChannel) =>
	updateRolePermissions(channel, PermissionFlagsBits.Connect, null);

export const hideChannel = (channel: VoiceChannel) =>
	updateRolePermissions(channel, PermissionFlagsBits.ViewChannel, false);

export const showChannel = (channel: VoiceChannel) =>
	updateRolePermissions(channel, PermissionFlagsBits.ViewChannel, null);

export async function inviteUsersToChannel(channel: VoiceChannel, userIds: string[]): Promise<void> {
	for (const userId of userIds) {
		await channel.permissionOverwrites.edit(userId, {
			Connect: true,
			ViewChannel: true,
		});
	}
}

export async function kickUsersFromChannel(channel: VoiceChannel, userIds: string[]): Promise<void> {
	for (const userId of userIds) {
		await channel.permissionOverwrites.edit(userId, {
			Connect: false,
			ViewChannel: null,
		});

		const member = channel.members.get(userId);
		if (member) {
			await member.voice.disconnect();
		}
	}
}
