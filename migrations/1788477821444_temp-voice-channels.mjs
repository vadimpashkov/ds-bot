/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
	pgm.createTable("temp_voice_channels", {
		channel_id: { type: "text", primaryKey: true },
		guild_id: { type: "text", notNull: true },
		owner_id: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
	});
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
	pgm.dropTable("temp_voice_channels");
};
