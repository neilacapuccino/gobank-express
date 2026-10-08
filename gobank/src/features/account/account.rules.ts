type Named = { fullName: string | null; username: string };

export const displayName = ({ fullName, username }: Named) =>
	fullName ?? `@${username}`;
