import { useCallback, useEffect, useState } from "react";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { NodeViewConstructor } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import editorKeymap from "@/lib/prosemirror/keymap";
import markdownParser from "@/lib/prosemirror/plugins/parser";
import footnoter from "@/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "@/lib/prosemirror/plugins/list-checkbox";
import textShortcutPlugin from "@/lib/prosemirror/plugins/text-shortcuts";
import transformer from "@/lib/prosemirror/plugins/transformer";
import CodeBlockView from "@/lib/prosemirror/views/code-view";
import HTMLView from "@/lib/prosemirror/views/html-view";
import ParagraphView from "@/lib/prosemirror/views/paragraph-view";
import "katex/dist/katex.min.css";
import MathBlockView from "@/lib/prosemirror/views/math-block-view";
import "~/css/editor.css";
import Toolbar from "@/components/editor/toolbar";
import { ProseMirror } from "@nytimes/react-prosemirror";
import BaseLayout from "@/components/layouts/base-layout";
import "prosemirror-view/style/prosemirror.css";
import BaseSidebar from "@/components/layouts/base-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { useSourceManager } from "@/lib/store/source-manager";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import { getNodeHash } from "@/lib/prosemirror/serialization/hash";

export const nodeViews: { [key: string]: NodeViewConstructor } = {
	paragraph(node, view, getPos) {
		return new ParagraphView(node, view, getPos);
	},
	code(node, view, getPos) {
		return new CodeBlockView(node, view, getPos, mdSchema);
	},
	html(node, view, getPos) {
		return new HTMLView(node, view, getPos, mdSchema);
	},
	math_block(node, view, getPos) {
		return new MathBlockView(node, view, getPos, mdSchema);
	},
};

export const editorPlugins = [
	history(),
	keymap(editorKeymap(mdSchema)),
	markdownParser,
	transformer,
	textShortcutPlugin,
	listItemDecorator,
	footnoter,
	tableEditing(),
];

const editorInitialState = EditorState.create({
	schema: mdSchema,
	plugins: editorPlugins,
});

/**
 * Main editor component
 */
export default function Editor() {
	const {
		setIsLoadingSource,
		changeCurrentSource,
		setLastSaveHash,
		currentSelection,
	} = useSourceManager();

	const [mount, setMount] = useState<HTMLElement | null>(null);
	const [editorState, setEditorState] =
		useState<EditorState>(editorInitialState);

	/**
	 * Reads the selected file and set it as the source of the
	 * editor. Set the last save hash to the content of the file.
	 */
	const loadSource = useCallback(() => {
		if (currentSelection.vault && currentSelection.filePath) {
			setIsLoadingSource(true);

			const { vault, filePath } = currentSelection;
			currentSelection.vault
				.getFileContent(filePath)
				.then((decodedFileContent) => {
					const doc = getNewDocFromMarkdown(decodedFileContent);
					getNodeHash(doc).then((docHash) => {
						setLastSaveHash(docHash);
					});

					const newEditorState = EditorState.create({
						schema: mdSchema,
						plugins: editorPlugins,
						doc,
					});
					setEditorState(newEditorState);

					changeCurrentSource(vault, filePath);
				})
				.catch((error) => {
					console.error("Source manager plugin: Could not read file", error);
					setLastSaveHash(null);
				})
				.finally(() => {
					setIsLoadingSource(false);
				});
		}
	}, [currentSelection]);

	useEffect(() => {
		loadSource();
	}, [currentSelection]);

	return (
		<BaseLayout>
			<BaseSidebar />
			<SidebarInset>
				<div className="max-w-7xl w-11/12 pt-10 mx-auto">
					<ProseMirror
						mount={mount}
						state={editorState}
						dispatchTransaction={(tr) => {
							setEditorState((oldState) => oldState.apply(tr));
						}}
						nodeViews={nodeViews}
					>
						<Toolbar />
						<div className="md-editor" ref={setMount} />
					</ProseMirror>
				</div>
			</SidebarInset>
		</BaseLayout>
	);
}
