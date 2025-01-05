import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { browserPrint, generatePDF } from "@/lib/prosemirror/export/pdf";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import {
	useEditorEventCallback,
	useEditorState,
} from "@nytimes/react-prosemirror";
import {
	Export,
	File,
	FileMd,
	FilePdf,
	Files,
	FloppyDisk,
	Printer,
} from "@phosphor-icons/react";
import { Node, Slice } from "prosemirror-model";
import { ChangeEvent, useCallback, useRef } from "react";
import { getMarkdownFromDocAsync } from "@/lib/prosemirror/serialization/serializer";
import Source from "./source";
import { useSourceManager } from "@/lib/store/source-manager";
import { useSidebar } from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";

/**
 * The main editor file menu component
 */
function Menu() {
	const { open: sidebarOpen, toggleSidebar } = useSidebar();
	const currentSource = useSourceManager((state) => state.currentSource);
	const saveDocToSource = useSourceManager((state) => state.saveDocToSource);
	const editorState = useEditorState();
	const openFileInputRef = useRef<HTMLInputElement>(null);

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
	const openFileHandler = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const markdownCode = await file.text();
			const doc = getNewDocFromMarkdown(markdownCode);
			replaceDocument(doc);
		}
	};

	/**
	 * Prints the editor content using the browser print feature
	 */
	const printDocument = useEditorEventCallback((view) => {
		browserPrint(view);
	});

	/**
	 * Export the editor content to Markdown
	 */
	const exportToMarkdown = useCallback(() => {
		getMarkdownFromDocAsync(editorState).then((code) => {
			const mdBlob = new Blob([code], { type: "text/markdown" });
			const mdBlobURL = URL.createObjectURL(mdBlob);

			const link = document.createElement("a");
			link.download = "exported.md";
			link.href = mdBlobURL;
			link.click();
			URL.revokeObjectURL(mdBlobURL);
		});
	}, [editorState]);

	/**
	 * Generate the PDF from the editor content
	 */
	const exportToPDF = useEditorEventCallback((view) => {
		generatePDF(view);
	});

	/**
	 * Saves the file
	 */
	const save = useCallback(() => {
		saveDocToSource(editorState);
	}, [editorState]);

	return (
		<div className="flex items-center">
			<Tooltip>
				<TooltipTrigger asChild>
					{/* Workaround for breaking props with `asChild` */}
					<div>
						<Toggle pressed={sidebarOpen} onMouseDown={toggleSidebar}>
							<Files />
						</Toggle>
					</div>
				</TooltipTrigger>
				<TooltipContent>Open vault manager</TooltipContent>
			</Tooltip>

			<DropdownMenu modal={false}>
				<input
					ref={openFileInputRef}
					type="file"
					name="menu-open-file"
					id="menu-open-file-input"
					className="hidden"
					accept=".txt,.md"
					onChange={(e) => openFileHandler(e)}
				/>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="px-3">
						<Source />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuItem onSelect={save} disabled={!currentSource}>
						<FloppyDisk />
						Save
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<Export />
							Export
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuItem onSelect={printDocument}>
									<Printer />
									Print
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={exportToPDF}>
									<FilePdf />
									PDF
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={exportToMarkdown}>
									<FileMd />
									Markdown
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
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
