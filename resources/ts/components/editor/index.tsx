import Toolbar from "@/components/editor/toolbar";
import mdSchema from "@/lib/prosemirror/editor-schema";
import editorKeymap from "@/lib/prosemirror/keymap";
import footnoter from "@/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "@/lib/prosemirror/plugins/list-checkbox";
import markdownParser from "@/lib/prosemirror/plugins/parser";
import textShortcutPlugin from "@/lib/prosemirror/plugins/text-shortcuts";
import transformer from "@/lib/prosemirror/plugins/transformer";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import { getNodeHash } from "@/lib/prosemirror/serialization/hash";
import CodeBlockView from "@/lib/prosemirror/views/code-view";
import HTMLView from "@/lib/prosemirror/views/html-view";
import MathBlockView from "@/lib/prosemirror/views/math-block-view";
import ParagraphView from "@/lib/prosemirror/views/paragraph-view";
import { useSourceManager } from "@/lib/store/source-manager";
import { ProseMirror } from "@nytimes/react-prosemirror";
import "katex/dist/katex.min.css";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { NodeViewConstructor } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { useCallback, useEffect, useState } from "react";
import "~/css/editor.css";

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
	const isCurrentSourceDeleted = useSourceManager(
		(state) => state.isCurrentSourceDeleted,
	);
	const currentSelection = useSourceManager((state) => state.currentSelection);
	const setIsLoadingSource = useSourceManager(
		(state) => state.setIsLoadingSource,
	);
	const changeCurrentSource = useSourceManager(
		(state) => state.changeCurrentSource,
	);
	const changeCurrentSourceDeletedFlag = useSourceManager(
		(state) => state.changeCurrentSourceDeletedFlag,
	);
	const setLastSaveHash = useSourceManager((state) => state.setLastSaveHash);

	const [mount, setMount] = useState<HTMLElement | null>(null);
	const [editorState, setEditorState] =
		useState<EditorState>(editorInitialState);

	/**
	 * Reads the selected file and sets it as the source of the
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

					changeCurrentSource({
						vault,
						filePath,
					});
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

	/**
	 * Clears the editor when the current source is deleted.
	 * Resets the flags after clearing.
	 */
	const clearSource = () => {
		const newEditorState = EditorState.create({
			schema: mdSchema,
			plugins: editorPlugins,
		});
		setEditorState(newEditorState);
		changeCurrentSource(null);
		changeCurrentSourceDeletedFlag(false);
	};

	useEffect(() => {
		loadSource();
	}, [currentSelection]);

	useEffect(() => {
		if (isCurrentSourceDeleted) {
			clearSource();
		}
	}, [isCurrentSourceDeleted]);

	return (
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
	);
}
