import {
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import { useSourceManager } from "@/lib/store/source-manager";
import { VaultFile } from "@/lib/vaults/types";
import { useQueryClient } from "@tanstack/react-query";

type BrowserFileMenuContentProps = {
	file: VaultFile;
};

export default function BrowserFileMenuContent({
	file,
}: BrowserFileMenuContentProps) {
	const queryClient = useQueryClient();
	const vault = useSourceManager((state) => state.currentSelection.vault);
	const changeCurrentSourceDeletedFlag = useSourceManager(
		(state) => state.changeCurrentSourceDeletedFlag,
	);
	const showAlertConfirmation = useConfirmationAlert(
		(state) => state.showConfirmationAlert,
	);

	/**
	 * Removes file from vault
	 */
	const removeFile = () => {
		return vault?.removeFile(file.absolutePath).then(() => {
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
				"This action cannot be undone. This will permanently delete the file and cannot be recovered!",
			);
		}
	};

	return (
		<DropdownMenuContent>
			<DropdownMenuItem onSelect={promptRemoveFile}>
				Remove file
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
}
