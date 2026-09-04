import { Pool } from "pg";
import { config } from "@/config";
import { logger } from "@/logger";

// REMARK:
// Один Pool на всё приложение - pg сам управляет несколькими соединениями
// внутри него, отдельный Pool на каждый запрос создавать не нужно!
export const pool = new Pool({
	connectionString: config.DATABASE_URL,
});

pool.on("error", (err) => {
	// REMARK:
	// Ошибки на "простаивающих" соединениях в пуле не бросают исключение
	// в месте вызова query() - их обязательно нужно слушать здесь,
	// иначе процесс может упасть без внятной причины.
	logger.error({ err }, "Неожиданная ошибка в пуле соединений Postgres");
});

export async function closeDb(): Promise<void> {
	await pool.end();
}
