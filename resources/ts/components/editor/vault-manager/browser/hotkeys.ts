type BrowserHotkey = {
	ctrlKey: boolean;
	shiftKey: boolean;
	key: string;
};

export const BROWSER_HOTKEYS = {
	COPY_HOTKEY: {
		ctrlKey: true,
		shiftKey: false,
		key: "c",
	},
	CUT_HOTKEY: {
		ctrlKey: true,
		shiftKey: false,
		key: "x",
	},
	PASTE_HOTKEY: {
		ctrlKey: true,
		shiftKey: false,
		key: "v",
	},
} as const;

export function getHotkeyText(hotkey: BrowserHotkey): string {
	const result: string[] = [];
	if (hotkey.ctrlKey) {
		result.push("Ctrl");
	}
	if (hotkey.shiftKey) {
		result.push("Shift");
	}
	if (hotkey.key) {
		result.push(hotkey.key.toUpperCase());
	}
	return result.join("+");
}
