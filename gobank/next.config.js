import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default config;
