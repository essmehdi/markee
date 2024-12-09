import path from "path";
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [
		viteReact(),
		laravel({
			input: ["resources/ts/inertia-bootstrap.tsx"],
			refresh: true,
		}),
	],
	resolve: {
    alias: {
      "@": path.resolve(__dirname, "./resources/ts"),
      "~": path.resolve(__dirname, "./resources"),
    },
  },
	server: {
		hmr: {
			host: "localhost",
		},
	},
});
