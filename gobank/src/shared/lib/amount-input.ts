export const isPesoInput = (value: string) =>
	/^\d{0,7}(?:\.\d{0,2})?$/.test(value);
