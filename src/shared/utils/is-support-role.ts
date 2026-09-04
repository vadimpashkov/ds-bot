import { config } from "@/config";

export const isSupportRole = (roleId: string): boolean => config.SUPPORT_ROLE_ID === roleId;
