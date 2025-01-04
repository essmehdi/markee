import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Vault } from "../vaults/types";
import { getMarkdownFromDocAsync } from "../prosemirror/serialization/serializer";
import { EditorState } from "prosemirror-state";
import { getNodeHash } from "../prosemirror/serialization/hash";

type Source = {
	filePath: string;
	vault: Vault;
};

type Selection = {
	filePath: string | null;
	vault: Vault | null;
}

export type SourceState = {
	/** Last save hash to track if the document is saved */
	lastSaveHash: string | null;
	/** True if the editor is loading the selection */
	isLoadingSource: boolean;
	/** Current source of the document */
	currentSource: Source | null;
	/** Current selection of the vault */
	currentSelection: Selection;

	/** Utility function to serialize the doc to save it */
	saveDocToSource: (editorState: EditorState) => void;
	/** lastSaveHash setter */
	setLastSaveHash: (hash: string | null) => void;
	/** isLoading setter */
	setIsLoadingSource: (loading: boolean) => void;
	/** currentSource setter */
	changeCurrentSource: (vault: Vault, filePath: string) => void;
	/** currentSelection setter */
	changeCurrentSelection: (
		vault: Vault | null,
		filePath: string | null
	) => void;
};

export const useSourceManager = create<SourceState>()(
	devtools<SourceState>((set, get) => ({
		lastSaveHash: null,
		isLoadingSource: false,
		currentSource: null,
		currentSelection: {
			filePath: null,
			vault: null,
		},

		saveDocToSource: async (editorState: EditorState) => {
			const currentSource = get().currentSource;
			if (!currentSource) {
				return;
			}

			const { vault, filePath } = currentSource;
			const markdown = await getMarkdownFromDocAsync(editorState);
			await vault.writeToFile(filePath, markdown);
			const saveHash = await getNodeHash(editorState.doc);
			set((state) => ({
				...state,
				lastSaveHash: saveHash,
			}));
		},
		setLastSaveHash: (hash) => {
			set((state) => {
				return {
					...state,
					lastSaveHash: hash,
				};
			});
		},
		setIsLoadingSource: (loading) => {
			set((state) => {
				return {
					...state,
					isLoadingSource: loading,
				};
			});
		},
		changeCurrentSource: (vault, filePath) => {
			if (
				get().currentSource?.vault?.id === vault?.id &&
				get().currentSource?.filePath === filePath
			) {
				return;
			}
			set((state) => {
				return {
					...state,
					currentSource: {
						filePath: filePath,
						vault: vault,
					},
				};
			});
		},
		changeCurrentSelection: (vault, filePath) => {
			if (
				get().currentSelection.vault?.id === vault?.id &&
				filePath === get().currentSelection.filePath
			) {
				return;
			}
			set((state) => {
				return {
					...state,
					currentSelection: {
						filePath: filePath,
						vault: vault,
					},
				};
			});
		},
	}))
);
