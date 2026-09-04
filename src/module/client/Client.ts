import {
	Collection,
	Client as DiscordClient,
	REST,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	Routes,
} from "discord.js";
import * as commands from "@/commands";
import type { Command } from "@/commands/types";
import { config } from "@/config";
import * as eventListeners from "@/events";
import type { Event } from "@/events/types";
import { logger } from "@/logger";

export class Client extends DiscordClient {
	private _commands = new Collection<string, Command<unknown>>();

	get commands() {
		return this._commands;
	}

	async init(token: string) {
		super.login(token).catch((err) => {
			logger.fatal({ err }, "Не удалось авторизоваться в Discord");
			process.exit(1);
		});
	}

	async start() {
		await this.commandsInit();
		this.eventsInit();
	}

	private async commandsInit() {
		this.saveCommandsEntities();
		await this.registerCommands();
	}

	private saveCommandsEntities() {
		Object.values(commands).forEach((command: Command<any>) => {
			this._commands.set(command.data.name, command);
		});
	}

	private async registerCommands() {
		if (this.token === null) {
			return;
		}

		const rest = new REST({ version: "10" }).setToken(this.token);
		const commands = this._commands.reduce((commandsData, command) => {
			commandsData.push(command.data.toJSON());

			logger.info({ name: command.data.name }, "Команда зарегистрирована");

			return commandsData;
		}, [] as RESTPostAPIChatInputApplicationCommandsJSONBody[]);

		try {
			logger.info("Регистрируем команды");

			// REMARK: Если нужно очистить команды
			// await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: [] });
			await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: commands });
		} catch (error) {
			logger.error(error, "Ошибка при регистрации команд");
		}
	}

	private eventsInit() {
		logger.info("Регистрируем эвенты");

		Object.values(eventListeners).forEach(({ name, execute, once = false }: Event<any>) => {
			(once ? this.once.bind(this) : this.on.bind(this))(name, execute);
		});
	}
}
