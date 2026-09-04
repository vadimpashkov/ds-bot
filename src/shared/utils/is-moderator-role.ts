import { config } from "@/config";

export const isModeratorRole = (roleId: string): boolean => config.MODERATOR_ROLE_ID === roleId;
