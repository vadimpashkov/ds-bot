import { Events } from "discord.js";
import type { Event } from "@/events/types";
import { voiceStateUpdateHandler } from "./handler";

export const voiceStateUpdateEvent: Event<Events.VoiceStateUpdate> = {
	name: Events.VoiceStateUpdate,
	execute: async (oldState, newState) => {
		await voiceStateUpdateHandler(oldState, newState);
	},
};
