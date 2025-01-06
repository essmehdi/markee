import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Vault } from "../vaults/types";
import { getMarkdownFromDocAsync } from "../prosemirror/serialization/serializer";
import { EditorState } from "prosemirror-state";
import { getNodeHash } from "../prosemirror/serialization/hash";

export type Source = {
	filePath: string;
	vault: Vault;
};

export type Selection = {
	filePath: string | null;
	vault: Vault | null;
};

export type SourceState = {
	/** Last save hash to track if the document is saved */
	lastSaveHash: string | null;
	/** Current document state hash */
	currentHash: string | null;
	/** True if the editor is loading the selection */
	isLoadingSource: boolean;
	/** Flag to indicate that the curren source has been deleted */
	isCurrentSourceDeleted: boolean;
	/** Current source of the document */
	currentSource: Source | null;
	/** Current selection of the vault browser */
	currentSelection: Selection;

	/** Utility function to serialize the doc to save it */
	saveDocToSource: (editorState: EditorState) => void;
	/** lastSaveHash setter */
	setLastSaveHash: (hash: string | null) => void;
	/** currentHash setter */
	setCurrentHash: (hash: string | null) => void;
	/** isLoading setter */
	setIsLoadingSource: (loading: boolean) => void;
	/** currentSource setter */
	changeCurrentSource: (source: Source | null) => void;
	/** currentSelection setter */
	changeCurrentSelection: (
		vault: Vault | null,
		filePath: string | null,
	) => void;
	changeCurrentSourceDeletedFlag: (flag: boolean) => void;
	checkDocSavedState: (editorState: EditorState) => Promise<boolean>;
};

export const useSourceManager = create<SourceState>()(
	devtools<SourceState>((set, get) => ({
		lastSaveHash: null,
		currentHash: null,
		isLoadingSource: false,
		isCurrentSourceDeleted: false,
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
			if (get().lastSaveHash === hash) {
				return;
			}
			set((state) => {
				return {
					...state,
					lastSaveHash: hash,
				};
			});
		},
		setCurrentHash: (hash) => {
			if (get().currentHash === hash) {
				return;
			}
			set((state) => {
				return {
					...state,
					currentHash: hash,
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
		changeCurrentSource: (source) => {
			if (
				get().currentSource?.vault.id === source?.vault.id &&
				get().currentSource?.filePath === source?.filePath
			) {
				return;
			}
			set((state) => {
				return {
					...state,
					currentSource: source,
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
		changeCurrentSourceDeletedFlag: (flag) => {
			set((state) => ({
				...state,
				isCurrentSourceDeleted: flag,
			}));
		},
		checkDocSavedState: async (editorState) => {
			const docHash = await getNodeHash(editorState.doc);
			return docHash === get().lastSaveHash;
		},
	})),
);
