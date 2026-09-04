import type { DateValue, EpochTimeStamp, UnixTimestamp } from "@/module/date/types";
import { DATE_ALIAS } from "./constants";

const isUnix = (value: number): boolean => {
	if (typeof value !== "number" || Number.isNaN(value)) {
		throw new Error("Invalid input: expected a number or a string that can be converted to a number");
	}

	return value < 10 ** 12;
};

const unixToTimestamp = (unix: UnixTimestamp): EpochTimeStamp => unix * DATE_ALIAS.MILLISECONDS_PER_SECOND;

const valueToDate = (value: DateValue): Date => {
	if (value instanceof Date) {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Date.parse(value);

		if (Number.isNaN(parsed)) {
			throw new Error(`Invalid date string: ${value}`);
		}

		return new Date(parsed);
	}

	if (typeof value === "number") {
		return new Date(isUnix(value) ? unixToTimestamp(value) : value);
	}

	throw new TypeError("Invalid input: value must be a string, number, or Date.");
};

export const formatLocalizedDate = (date: DateValue, locale: string, options?: Intl.DateTimeFormatOptions): string => {
	const formatter = new Intl.DateTimeFormat(locale, options);
	const convertedDate = valueToDate(date);

	return formatter.format(convertedDate);
};

export const isToday = (date: DateValue): boolean => {
	const convertedDate = valueToDate(date);
	const now = new Date();

	return (
		convertedDate.getFullYear() === now.getFullYear() &&
		convertedDate.getMonth() === now.getMonth() &&
		convertedDate.getDate() === now.getDate()
	);
};

export const isYesterday = (date: DateValue): boolean => {
	const convertedDate = valueToDate(date);
	const now = new Date();

	const givenDate = new Date(convertedDate.getFullYear(), convertedDate.getMonth(), convertedDate.getDate());
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

	return givenDate.getTime() === yesterday.getTime();
};
