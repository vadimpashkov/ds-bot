import { config } from "@/config";

export const isOwner = (userId: string): boolean => userId === config.OWNER_ID;
