import { config } from "@/config";

export const isAdminRole = (roleId: string): boolean => config.ADMIN_ROLE_ID === roleId;
