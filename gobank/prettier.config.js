/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      options: { useTabs: true, tabWidth: 2 },
    },
  ],
};
