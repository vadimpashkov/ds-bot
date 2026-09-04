import type { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export type Command<P> = {
	data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (...params: P[]) => Promise<void>;
};
