import { useEffect } from "react";

type UseHotkeyConfig = {
	ctrlKey: boolean;
	shiftKey: boolean;
	key: string;
	callback: (e: KeyboardEvent) => void;
};

/**
 * React hook for handling keyboard shortcuts/hotkeys
 * @param ctrlKey - Boolean indicating if Ctrl key (or Cmd on Mac) should be pressed
 * @param shiftKey - Boolean indicating if Shift key should be pressed
 * @param key - String representing the key to listen for (case insensitive)
 * @param callback - Function to execute when the hotkey combination is pressed
 * @example
 * ```tsx
 * // Listen for Ctrl+Shift+S
 * useHotkey(true, true, 's', (e) => {
 *   console.log('Ctrl+Shift+S pressed');
 * });
 * ```
 */
export function useHotkey({ ctrlKey, shiftKey, key, callback }: UseHotkeyConfig) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = navigator.userAgent.includes("Mac");
			const ctrlPressed = isMac ? e.metaKey : e.ctrlKey;

			if (ctrlPressed === ctrlKey && e.shiftKey === shiftKey && e.key.toLowerCase() === key.toLowerCase()) {
				e.preventDefault();
				callback(e);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [ctrlKey, shiftKey, key, callback]);
}
