import { EditorState } from "prosemirror-state";
import { deleteTable, addRowBefore as prosemirrorAddRowBefore } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { Node } from "prosemirror-model";

/**
 * ProseMirror command to add a row before the current selected row.
 * It does nothing if the selected node is not a header row.
 */
export function addRowBefore(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const selection = editorState.selection;
	const currentNode = selection.$from.parent;
	if (currentNode.type === mdSchema.nodes.table_header) {
		return false;
	}
	return prosemirrorAddRowBefore(editorState, dispatch);
}

/**
 * ProseMirror command to delete a table if the selection is the first cell
 * and the table is empty
 */
export function maybeDeleteTable(editorState: EditorState, dispatch?: EditorView["dispatch"]) {
	const selection = editorState.selection;
	const selectedNodeSecondAncestor: Node | undefined = selection.$from.node(selection.$from.depth - 2);
	const cellRowIndex = selection.$from.index(selection.$from.depth - 2);
	const cellColumnIndex = selection.$from.index(selection.$from.depth - 1);

	if (
		selectedNodeSecondAncestor?.type !== mdSchema.nodes.table ||
		!selection.empty ||
		selectedNodeSecondAncestor.textContent.trim() !== "" ||
		cellRowIndex !== 0 ||
		cellColumnIndex !== 0
	) {
		return false;
	}

	deleteTable(editorState, dispatch);
	return true;
}
