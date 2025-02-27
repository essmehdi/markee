import ImagePicker from "@/components/editor/node-widgets/image-picker";
import mdSchema from "@/lib/prosemirror/editor-schema";
import editorKeymap from "@/lib/prosemirror/keymap";
import footnoter from "@/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "@/lib/prosemirror/plugins/list-checkbox";
import markdownParser from "@/lib/prosemirror/plugins/parser";
import pasteHandler from "@/lib/prosemirror/plugins/paste-handler";
import textShortcutPlugin from "@/lib/prosemirror/plugins/text-shortcuts";
import transformer from "@/lib/prosemirror/plugins/transformer";
import { getNewDocFromMarkdown } from "@/lib/prosemirror/serialization/deserializer";
import { getNodeHash } from "@/lib/prosemirror/serialization/hash";
import CodeBlockView from "@/lib/prosemirror/views/code-view";
import HTMLView from "@/lib/prosemirror/views/html-view";
import MathBlockView from "@/lib/prosemirror/views/math-block-view";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import { useSourceManager } from "@/lib/store/source-manager";
import { ProseMirror } from "@nytimes/react-prosemirror";
import "katex/dist/katex.min.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import "prosemirror-tables/style/tables.css";
import { NodeViewConstructor } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { useEffect, useState } from "react";
import "~/css/editor.css";
import Toolbar from "./toolbar";
import decorator from "@/lib/prosemirror/plugins/decorator";

export const nodeViews: { [key: string]: NodeViewConstructor } = {
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
	decorator,
	transformer,
	textShortcutPlugin,
	listItemDecorator,
	footnoter,
	tableEditing({ allowTableNodeSelection: true }),
	pasteHandler,
];

export const editorInitialState = EditorState.create({
	schema: mdSchema,
	plugins: editorPlugins,
});

/**
 * Main editor component
 */
export default function Editor() {
	const {
		isCurrentSourceDeleted,
		isLoadingSource,
		currentSelection,
		currentSource,
		lastSaveHash,
		currentHash,
		setIsLoadingSource,
		changeCurrentSource,
		changeCurrentSourceDeletedFlag,
		setLastSaveHash,
		setCurrentHash,
	} = useSourceManager();
	const { showConfirmationAlert } = useConfirmationAlert();

	const [mount, setMount] = useState<HTMLElement | null>(null);
	const [editorState, setEditorState] = useState<EditorState>(editorInitialState);

	/**
	 * Reads the selected file and sets it as the source of the
	 * editor. Set the last save hash to the content of the file.
	 */
	const loadSource = () => {
		const doLoadSource = () => {
			setIsLoadingSource(true);

			const { vault, file } = currentSelection;
			vault!
				.getFileContent(file!)
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
						vault: vault!,
						file: file!,
					});
				})
				.catch((error) => {
					console.error("Could not read file", error);
					setLastSaveHash(null);
				})
				.finally(() => {
					setIsLoadingSource(false);
				});
		};

		if (
			currentSelection.vault &&
			currentSelection.file &&
			(currentSelection.vault !== currentSource?.vault || currentSelection.file !== currentSource?.file)
		) {
			if (currentSource && lastSaveHash !== currentHash) {
				showConfirmationAlert(
					doLoadSource,
					"Are you sure?",
					"This will replace the current document and all unsaved content will be lost and cannot be recovered. The history will be reset consequently."
				);
			} else {
				doLoadSource();
			}
		}
	};

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
		setLastSaveHash(null);
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

	useEffect(() => {
		if (editorState) {
			getNodeHash(editorState.doc).then((hash) => setCurrentHash(hash));
		}
	}, [editorState]);

	return (
		<ProseMirror
			mount={mount}
			state={editorState}
			dispatchTransaction={(tr) => {
				setEditorState((oldState) => oldState.apply(tr));
			}}
			nodeViews={nodeViews}
			editable={() => !isLoadingSource}
		>
			<Toolbar />
			<ImagePicker />
			<div className="md-editor" ref={setMount} />
		</ProseMirror>
	);
}
