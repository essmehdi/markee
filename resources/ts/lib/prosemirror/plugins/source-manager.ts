import { useSourceManager } from "@/lib/store/source-manager";
import { EditorState, Plugin } from "prosemirror-state";
import mdSchema from "../editor-schema";
import { editorPlugins } from "@/components/editor";
import { getNewDocFromMarkdown } from "../serialization/deserializer";

const sourceManager = new Plugin({
	view(view) {
		const sourceUnsubsribe = useSourceManager.subscribe((state) => {
			const { vault: currentVault, filePath: currentFilePath } = state.currentSelection;
			if (currentVault && currentFilePath) {
				currentVault
					.getFileContent(currentFilePath)
					.then((decodedFileContent) => {
						const doc = getNewDocFromMarkdown(decodedFileContent);
						const newEditorState = EditorState.create({
							schema: mdSchema,
							plugins: editorPlugins,
							doc,
						});
						view.updateState(newEditorState);
					})
					.catch((error) => {
						console.error("Source manager plugin: Could not read file", error);
					});
			}
		});
		return {
			destroy() {
				sourceUnsubsribe();
			},
		};
	},
});

export default sourceManager;