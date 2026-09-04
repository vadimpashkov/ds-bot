export type ObjectValues<T> = T[keyof T];
export type EmptyObject = Record<string, never>;

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
	? `${T extends Uppercase<T> ? `_${Lowercase<T>}` : T}${CamelToSnakeCase<U>}`
	: S;

export type CamelToSnakeKeys<T> = {
	[K in keyof T as CamelToSnakeCase<Extract<K, string>>]: T[K] extends object
		? T[K] extends Function | Array<any> | Date
			? T[K]
			: CamelToSnakeKeys<T[K]>
		: T[K];
};
