import BrowserContext from "~/components/editor/vault-manager/browser/context";
import {
  BROWSER_HOTKEYS,
  getHotkeyText,
} from "~/components/editor/vault-manager/browser/hotkeys";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "~/components/ui/context-menu";
import useConfirmationAlert from "~/lib/store/confirmation-alert-manager";
import { useSourceManager } from "~/lib/store/source-manager";
import { VaultFile } from "~/lib/vaults/types";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

type BrowserFileMenuContentProps = {
  file: VaultFile;
};

export default function BrowserFileMenuContent({
  file,
}: BrowserFileMenuContentProps) {
  const queryClient = useQueryClient();
  const vault = useSourceManager((state) => state.currentSelection.vault);
  const changeCurrentSourceDeletedFlag = useSourceManager(
    (state) => state.changeCurrentSourceDeletedFlag
  );
  const showAlertConfirmation = useConfirmationAlert(
    (state) => state.showConfirmationAlert
  );
  const { setClipboard } = useContext(BrowserContext);

  /**
   * Removes file from vault
   */
  const removeFile = () => {
    return vault?.remove(file).then(() => {
      changeCurrentSourceDeletedFlag(true);
      queryClient.invalidateQueries({ queryKey: ["vault"] });
    });
  };

  /**
   * Asks confirmation before removing the file
   */
  const promptRemoveFile = () => {
    if (vault) {
      showAlertConfirmation(
        removeFile,
        "Are you sure?",
        "This action cannot be undone. This will permanently delete the file and cannot be recovered!"
      );
    }
  };

  return (
    <ContextMenuContent>
      <ContextMenuItem
        onSelect={() => setClipboard({ items: [file], move: false })}
      >
        Copy
        <ContextMenuShortcut>
          {getHotkeyText(BROWSER_HOTKEYS.COPY_HOTKEY)}
        </ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => setClipboard({ items: [file], move: true })}
      >
        Cut
        <ContextMenuShortcut>
          {getHotkeyText(BROWSER_HOTKEYS.CUT_HOTKEY)}
        </ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem className="text-destructive" onSelect={promptRemoveFile}>
        Remove
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
