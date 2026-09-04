import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN обязателен"),
	CLIENT_ID: z.string().min(1, "CLIENT_ID обязателен"),
	OWNER_ID: z.string().min(1, "OWNER_ID обязателен"),

	ADMIN_ROLE_ID: z.string().min(1, "ADMIN_ROLE_ID обязателен"),
	MODERATOR_ROLE_ID: z.string().min(1, "MODERATOR_ROLE_ID обязателен"),
	SUPPORT_ROLE_ID: z.string().min(1, "SUPPORT_ROLE_ID обязателен"),
	BOT_ROLE_ID: z.string().min(1, "BOT_ROLE_ID обязателен"),

	GUILD_ID: z.string().min(1, "GUILD_ID обязателен"),
	PREFIX: z.string().min(1, "PREFIX обязателен"),
	RULES_PATH: z.string().min(1, "RULES_PATH обязателен"),
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
	DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	// eslint-disable-next-line no-console
	console.error("Ошибка конфигурации (.env):", z.treeifyError(parsed.error).errors);
	process.exit(1);
}

globalThis.__DEBUG__ = parsed.data.NODE_ENV !== "production";

export const config = parsed.data;
