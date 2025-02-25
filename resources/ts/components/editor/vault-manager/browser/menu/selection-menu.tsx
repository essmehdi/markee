import BrowserContext from "@/components/editor/vault-manager/browser/context";
import { BROWSER_HOTKEYS, getHotkeyText } from "@/components/editor/vault-manager/browser/hotkeys";
import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { useContext } from "react";

export default function BrowserSelectionMenu() {
	const { selection, setClipboard } = useContext(BrowserContext);

	return (
		<ContextMenuContent>
			<ContextMenuItem onSelect={() => setClipboard({ items: selection, move: false })}>
				Copy
				<ContextMenuShortcut>{getHotkeyText(BROWSER_HOTKEYS.COPY_HOTKEY)}</ContextMenuShortcut>
			</ContextMenuItem>
			<ContextMenuItem onSelect={() => setClipboard({ items: selection, move: true })}>
				Cut
				<ContextMenuShortcut>{getHotkeyText(BROWSER_HOTKEYS.CUT_HOTKEY)}</ContextMenuShortcut>
			</ContextMenuItem>
			<ContextMenuSeparator />
		</ContextMenuContent>
	);
}
