import { config } from "@/config";

export function isStaffRole(roleId: string): boolean {
	return [config.ADMIN_ROLE_ID, config.MODERATOR_ROLE_ID, config.SUPPORT_ROLE_ID, config.BOT_ROLE_ID].includes(
		roleId,
	);
}
