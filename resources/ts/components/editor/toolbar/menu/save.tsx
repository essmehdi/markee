import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Source, useSourceManager } from "@/lib/store/source-manager";
import { FloppyDisk } from "@phosphor-icons/react";
import { EditorState } from "prosemirror-state";

type SaveMenuItemProps = {
	editorState: EditorState;
	currentSource: Source | null;
};

export default function SaveMenuItem({
	editorState,
	currentSource,
}: SaveMenuItemProps) {
	const saveDocToSource = useSourceManager((state) => state.saveDocToSource);

	/**
	 * Saves the file
	 */
	const save = () => {
		saveDocToSource(editorState);
	};

	return (
		<DropdownMenuItem onSelect={save} disabled={!currentSource}>
			<FloppyDisk />
			Save
		</DropdownMenuItem>
	);
}
