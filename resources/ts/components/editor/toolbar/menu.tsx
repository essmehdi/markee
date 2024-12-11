import { Button } from "@/components/ui/button";
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
import mdSchema from "@/lib/prosemirror/editor-schema";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import { useEditorEventCallback } from "@nytimes/react-prosemirror";
import { Export, FileMd, FilePdf, List } from "@phosphor-icons/react";
import jsPDF from "jspdf";
import { Node, Slice } from "prosemirror-model";
import { ChangeEvent, memo, useRef } from "react";

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

	const exportToPdf = useEditorEventCallback((view) => {
		let pdf = new jsPDF("p", "pt", "a4");
		pdf.html(view.dom, {
			callback(doc) {
				doc.save();
			}
		})
	});

	return (
		<DropdownMenu>
			<input
				ref={openFileInputRef}
				type="file"
				name="menu-open-file"
				id="menu-open-file-input"
				className="hidden"
				accept="text/*"
				onChange={(e) => openFileHandler(e)}
			/>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost">
					<List />
					Menu
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem onSelect={() => openFileInputRef.current?.click()}>
					<FileMd />
					Import file
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Export />
						Export
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem onSelect={exportToPdf}>
								<FilePdf />
								PDF
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default memo(Menu);
