import * as button from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { browserPrint, generatePDF } from "@/lib/prosemirror/export/pdf";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import { useEditorEventCallback } from "@nytimes/react-prosemirror";
import {
	Export,
	File,
	FileMd,
	FilePdf,
	List,
	Printer,
} from "@phosphor-icons/react";
import { Node, Slice } from "prosemirror-model";
import { ChangeEvent, useRef } from "react";
import { getMarkdownFromDocumentAsync } from "@/lib/prosemirror/export/markdown";

function Menu() {
	const openFileInputRef = useRef<HTMLInputElement>(null);

	const replaceDocument = useEditorEventCallback((view, doc: Node) => {
		if (doc.type !== mdSchema.nodes.doc) {
			throw new Error("Node must be of type 'doc' to replace the document");
		}

		const state = view.state;
		view.dispatch(
			state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0))
		);
	});

	const openFileHandler = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const markdownCode = await file.text();
			const doc = getNewDocFromMarkdown(markdownCode);
			replaceDocument(doc);
		}
	};

	const printDocument = useEditorEventCallback((view) => {
		browserPrint(view);
	});

	const exportToMarkdown = useEditorEventCallback((view) => {
		getMarkdownFromDocumentAsync(view).then((code) => {
			const mdBlob = new Blob([code], { type: "text/markdown" });
			const mdBlobURL = URL.createObjectURL(mdBlob);

			const link = document.createElement("a");
			link.download = "exported.md";
			link.href = mdBlobURL;
			link.click();
			URL.revokeObjectURL(mdBlobURL);
		});
	});

	const exportToPDF = useEditorEventCallback((view) => {
		generatePDF(view);
	});

	return (
		<DropdownMenu>
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
				<button.Button variant="ghost">
					<List />
					Menu
				</button.Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem onSelect={() => openFileInputRef.current?.click()}>
					<File />
					Import file
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default Menu;
