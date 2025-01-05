import {
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import useDialog from "@/lib/store/dialog-manager";
import { VaultDirectory } from "@/lib/vaults/types";
import NewItemDialog from "./new-item-dialog";

type BrowserDirectoryMenuContentProps = {
	directory: VaultDirectory;
};

export default function BrowserDirectoryMenuContent({
	directory,
}: BrowserDirectoryMenuContentProps) {
	const showDialog = useDialog((state) => state.showDialog);
	const closeDialog = useDialog((state) => state.closeDialog);

	return (
		<DropdownMenuContent>
			<DropdownMenuItem
				onClick={() => {
					showDialog(
						<NewItemDialog
							closeDialog={closeDialog}
							location={directory.absolutePath}
							type="file"
						/>
					);
				}}
			>
				New file
			</DropdownMenuItem>
			<DropdownMenuItem
				onSelect={() => {
					showDialog(
						<NewItemDialog
							closeDialog={closeDialog}
							location={directory.absolutePath}
							type="directory"
						/>
					);
				}}
			>
				New directory
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
}
