type Named = { fullName: string | null; username: string };

export const firstName = ({ fullName, username }: Named) =>
  (fullName ?? username).split(" ")[0];

export const displayName = ({ fullName, username }: Named) =>
  fullName ?? `@${username}`;

export const initial = ({ fullName, username }: Named) =>
  (fullName ?? username).charAt(0);
