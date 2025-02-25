import BrowserContext from "@/components/editor/vault-manager/browser/context";
import { BROWSER_HOTKEYS, getHotkeyText } from "@/components/editor/vault-manager/browser/hotkeys";
import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
} from "@/components/ui/context-menu";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import useDialog from "@/lib/store/dialog-manager";
import { useSourceManager } from "@/lib/store/source-manager";
import { VaultDirectory } from "@/lib/vaults/types";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import NewItemDialog from "../../dialogs/new-item-dialog";

type BrowserDirectoryMenuContentProps = {
	directory: VaultDirectory;
};

export default function BrowserDirectoryMenuContent({ directory }: BrowserDirectoryMenuContentProps) {
	const { clipboard, setClipboard, copy, move } = useContext(BrowserContext);

	const queryClient = useQueryClient();
	const vault = useSourceManager((state) => state.currentSelection.vault);
	const changeCurrentSourceDeletedFlag = useSourceManager((state) => state.changeCurrentSourceDeletedFlag);
	const showAlertConfirmation = useConfirmationAlert((state) => state.showConfirmationAlert);
	const showDialog = useDialog((state) => state.showDialog);
	const closeDialog = useDialog((state) => state.closeDialog);

	/**
	 * Removes file from vault
	 */
	const removeDirectory = () => {
		return vault?.remove(directory).then(() => {
			changeCurrentSourceDeletedFlag(true);
			queryClient.invalidateQueries({ queryKey: ["vault"] });
		});
	};

	/**
	 * Asks confirmation before removing the file
	 */
	const promptRemoveDirectory = () => {
		if (vault) {
			showAlertConfirmation(
				removeDirectory,
				"Are you sure?",
				"This action cannot be undone. This will permanently delete the file and cannot be recovered!"
			);
		}
	};


	return (
		<ContextMenuContent>
			<ContextMenuItem
				onSelect={() => {
					showDialog(<NewItemDialog closeDialog={closeDialog} location={directory} type="file" />);
				}}
			>
				New file
			</ContextMenuItem>
			<ContextMenuItem
				onSelect={() => {
					showDialog(<NewItemDialog closeDialog={closeDialog} location={directory} type="directory" />);
				}}
			>
				New directory
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onSelect={() => setClipboard({ items: [directory], move: false })}>
				Copy
				<ContextMenuShortcut>{getHotkeyText(BROWSER_HOTKEYS.COPY_HOTKEY)}</ContextMenuShortcut>
			</ContextMenuItem>
			<ContextMenuItem onSelect={() => setClipboard({ items: [directory], move: true })}>
				Cut
				<ContextMenuShortcut>{getHotkeyText(BROWSER_HOTKEYS.CUT_HOTKEY)}</ContextMenuShortcut>
			</ContextMenuItem>
			<ContextMenuItem
				disabled={clipboard.items.length === 0}
				onSelect={() =>
					clipboard.move
						? move({ items: clipboard.items, destination: directory })
						: copy({ items: clipboard.items, destination: directory })
				}
			>
				Paste
				<ContextMenuShortcut>{getHotkeyText(BROWSER_HOTKEYS.PASTE_HOTKEY)}</ContextMenuShortcut>
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem className="text-destructive" onSelect={promptRemoveDirectory}>
				Remove
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
