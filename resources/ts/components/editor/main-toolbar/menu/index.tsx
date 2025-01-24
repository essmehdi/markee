import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import { useSourceManager } from "@/lib/store/source-manager";
import {
	useEditorEventCallback,
	useEditorState,
} from "@nytimes/react-prosemirror";
import { File } from "@phosphor-icons/react";
import { Node, Slice } from "prosemirror-model";
import { ChangeEvent, useRef } from "react";
import SidebarToggle from "../sidebar-toggle";
import Source from "../source";
import ExportSubMenu from "./export";
import SaveMenuItem from "./save";

/**
 * The main editor file menu component
 */
function Menu() {
	const openFileInputRef = useRef<HTMLInputElement>(null);
	const currentSource = useSourceManager((state) => state.currentSource);
	const lastSaveHash = useSourceManager((state) => state.lastSaveHash);
	const currentHash = useSourceManager((state) => state.currentHash);
	const isLoadingSource = useSourceManager((state) => state.isLoadingSource);
	const { showConfirmationAlert } = useConfirmationAlert();
	const editorState = useEditorState();

	const isSaved =
		currentSource === null || isLoadingSource
			? undefined
			: lastSaveHash === currentHash;

	/**
	 * Replaces the current document content with a new doc
	 */
	const replaceDocument = useEditorEventCallback((view, doc: Node) => {
		if (doc.type !== mdSchema.nodes.doc) {
			throw new Error("Node must be of type 'doc' to replace the document");
		}

		const state = view.state;
		view.dispatch(
			state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)),
		);
	});

	/**
	 * Handles the event of choosing a file to import
	 */
	const openFileHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const action = async () => {
				const markdownCode = await file.text();
				const doc = getNewDocFromMarkdown(markdownCode);
				replaceDocument(doc);
			};
			if (currentSource) {
				// If the document is a draft or the document is not saved,
				// ask for confirmation.
				showConfirmationAlert(
					action,
					"Are you sure?",
					"All the document content will be replaced by the imported file content. History will be preserved.",
				);
			} else {
				action();
			}
		}
	};

	return (
		<div className="flex items-center">
			<SidebarToggle />
			<DropdownMenu modal={false}>
				<input
					ref={openFileInputRef}
					type="file"
					name="menu-open-file"
					id="menu-open-file-input"
					className="hidden"
					accept=".txt,.md"
					onChange={openFileHandler}
				/>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="px-3">
						<Source saved={isSaved} currentSource={currentSource} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<SaveMenuItem
						editorState={editorState}
						currentSource={currentSource}
					/>
					<ExportSubMenu editorState={editorState} />
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => openFileInputRef.current?.click()}>
						<File />
						Import file
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default Menu;
