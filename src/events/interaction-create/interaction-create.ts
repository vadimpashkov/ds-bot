import { Events } from "discord.js";
import { voiceControlInteractionHandler, voiceControlModalInteractionHandler } from "@/controls/voice-channel";
import type { Event } from "@/events/types";
import { interactionCreateHandler } from "./handler";

export const interactionCreateEvent: Event<Events.InteractionCreate> = {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		if (interaction.isChatInputCommand()) {
			interactionCreateHandler(interaction);
			return;
		}

		if (interaction.isButton() || interaction.isUserSelectMenu()) {
			await voiceControlInteractionHandler(interaction);
			return;
		}

		if (interaction.isModalSubmit()) {
			await voiceControlModalInteractionHandler(interaction);
			return;
		}
	},
};
