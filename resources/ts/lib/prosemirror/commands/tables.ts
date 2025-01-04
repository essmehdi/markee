import { EditorState } from "prosemirror-state";
import { addRowBefore as prosemirrorAddRowBefore } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";

/**
 * ProseMirror command to add a row before the current selected row.
 * It does nothing if the selected node is not a header row.
 */
export function addRowBefore(
	editorState: EditorState,
	dispatch?: EditorView["dispatch"],
): boolean {
	const selection = editorState.selection;
	const currentNode = selection.$from.node(3);
	if (currentNode.type === mdSchema.nodes.table_header) {
		return false;
	}
	return prosemirrorAddRowBefore(editorState, dispatch);
}
