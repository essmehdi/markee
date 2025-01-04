import { editorActionKeybinds } from "@/lib/prosemirror/keymap";
import { describe, test, expect, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";

type KeybindNodeMap = {
	[K in (typeof editorActionKeybinds)[keyof typeof editorActionKeybinds]]?: {
		targetNodeLocator: string;
		customCheck?: () => void;
	};
};

const keybindNodeMap: KeybindNodeMap = {
	[editorActionKeybinds.CODE_BLOCK]: {
		targetNodeLocator: "div.ProseMirror > div.cm-editor",
	},
	[editorActionKeybinds.BULLET_LIST]: {
		targetNodeLocator: ".ProseMirror ul",
	},
	[editorActionKeybinds.ORDERED_LIST]: {
		targetNodeLocator: ".ProseMirror ol",
	},
	[editorActionKeybinds.TABLE]: {
		targetNodeLocator: ".ProseMirror table",
	},
};

/**
 * Converts ProseMirror keybind format to Playwright format
 */
function getPlaywrightKeystrokeFromKeybind(keybind: string) {
	return keybind
		.split("-")
		.map((k) => (k === "Mod" ? "Control" : k))
		.join("+");
}

describe("Keybinds", () => {
	describe("Blocks keybinds", () => {
		const keybinds = Object.keys(
			keybindNodeMap
		) as (keyof typeof keybindNodeMap)[];
		for (let i = 0; i < keybinds.length; i++) {
			const keybind = keybinds[i];
			const { targetNodeLocator, customCheck } = keybindNodeMap[keybind]!;

			test(`Test keybind ${keybind}`, async () => {
				// await page.goto("./editor");
				window.location.href = "http://localhost:8000/editor"
				await vi.waitUntil(() => document.querySelector("div.ProseMirror"))
				// await page.locator("div.ProseMirror").waitFor();
				// await expect(page.eleme)

				const textToInsert = "Some text to test out the code block";
				await userEvent.keyboard(textToInsert);

				if (customCheck) {
					customCheck();
				} else {
					const keybindToPress = getPlaywrightKeystrokeFromKeybind(keybind);
					await userEvent.keyboard(keybindToPress);

					// await expect(
					// 	page
					// 		.locator(targetNodeLocator)
					// 		.filter({ has: page.getByText(textToInsert) })
					// ).toBeVisible();
					await vi.waitUntil(() => document.querySelector(targetNodeLocator))
					expect((document.querySelector(targetNodeLocator)! as HTMLElement).innerText).toBe(textToInsert);
				}
			});
		}
	});
});
