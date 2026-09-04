import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	LabelBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	UserSelectMenuBuilder,
} from "discord.js";

export function buildVoiceControlComponents(channelId: string) {
	// REMARK: Необходимо, чтобы сбрасывать элементы (буквально их пересоздавая с новым customId)
	const nonce = Date.now();

	const toggleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`voice:settings:${channelId}:${nonce}`)
			.setLabel("⚙️ Настройки")
			.setStyle(ButtonStyle.Secondary),
	);

	const inviteRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
		new UserSelectMenuBuilder()
			.setCustomId(`voice:invite:${channelId}:${nonce}`)
			.setPlaceholder("➕ Пригласить участников")
			.setMinValues(1)
			.setMaxValues(10),
	);

	const kickRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
		new UserSelectMenuBuilder()
			.setCustomId(`voice:kick:${channelId}:${nonce}`)
			.setPlaceholder("🦵 Исключить участников")
			.setMinValues(1)
			.setMaxValues(10),
	);

	return [toggleRow, inviteRow, kickRow];
}

export function buildVoiceControlModal(
	channelId: string,
	options: { channelName: string; userLimit: number; isPrivate: boolean; isInvisible: boolean },
) {
	const modal = new ModalBuilder().setCustomId(`voice:settings:${channelId}`).setTitle("Настройка голосовой комнаты");

	const channelNameInput = new TextInputBuilder()
		.setCustomId("voice:change:channel-name")
		.setStyle(TextInputStyle.Short)
		.setValue(options.channelName)
		.setPlaceholder("Введи название комнаты");
	const channelNameLabel = new LabelBuilder()
		.setLabel("Название канала")
		.setDescription("Введите название канала длиной от 3 до 20 символов.")
		.setTextInputComponent(channelNameInput);

	const userLimitInput = new TextInputBuilder()
		.setCustomId("voice:change:user-limit")
		.setStyle(TextInputStyle.Short)
		.setValue(options.userLimit.toString())
		.setPlaceholder("Введи кол-во слотов (от 2 до 99)");
	const userLimitLabel = new LabelBuilder()
		.setLabel("Количество слотов")
		.setDescription("Укажите количество слотов в диапазоне от 2 до 99.")
		.setTextInputComponent(userLimitInput);

	const checkboxSettingsLabel = new LabelBuilder()
		.setLabel("Приватность и видимость")
		.setCheckboxGroupComponent((checkboxes) =>
			checkboxes
				.setCustomId("voice:toggle:private-and-invisible")
				.addOptions([
					{
						label: "Сделать канал приватным",
						value: "voice:toggle:is-private",
						description:
							"В канал смогут зайти только по вашему приглашению. Стаффы могут зайти самостоятельно.",
						default: options.isPrivate,
					},
					{
						label: "Скрыть канал",
						value: "voice:toggle:is-invisible",
						description: "Канал будет невидим для всех участников. Стаффы продолжат видеть ваш канал.",
						default: options.isInvisible,
					},
				])
				.setRequired(false),
		);

	modal
		.addLabelComponents(channelNameLabel)
		.addLabelComponents(userLimitLabel)
		.addLabelComponents(checkboxSettingsLabel);

	return modal;
}
