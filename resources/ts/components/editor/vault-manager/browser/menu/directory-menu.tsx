import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import useDialog from "@/lib/store/dialog-manager";
import { FilePlus, FolderPlus } from "@phosphor-icons/react";
import NewItemDialog from "./new-item-dialog";

type BrowserDirectoryMenuContentProps = {
	directoryPath: string;
};

export default function BrowserDirectoryMenuContent({ directoryPath: directory }: BrowserDirectoryMenuContentProps) {
	const showDialog = useDialog((state) => state.showDialog);
	const closeDialog = useDialog((state) => state.closeDialog);

	return (
		<DropdownMenuContent>
			<DropdownMenuItem
				onClick={() => {
					showDialog(<NewItemDialog closeDialog={closeDialog} location={directory} type="file" />);
				}}
			>
				<FilePlus />
				New file
			</DropdownMenuItem>
			<DropdownMenuItem
				onSelect={() => {
					showDialog(<NewItemDialog closeDialog={closeDialog} location={directory} type="directory" />);
				}}
			>
				<FolderPlus />
				New directory
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
}
