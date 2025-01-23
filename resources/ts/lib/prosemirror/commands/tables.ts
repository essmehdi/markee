import { EditorState, Transaction } from "prosemirror-state";
import { deleteTable, isInTable, rowIsHeader, selectedRect, tableNodeTypes, TableRect } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { Node } from "prosemirror-model";

/**
 * Modified `addRow` to ensure same alignment attributes
 */
export function addRow(tr: Transaction, { map, tableStart, table }: TableRect, row: number): Transaction {
	let rowPos = tableStart;
	for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
	const cells = [];
	let refRow: number | null = row > 0 ? -1 : 0;
	if (rowIsHeader(map, table, row + refRow)) refRow = row == 0 || row == map.height ? null : 0;
	for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
		// Covered by a rowspan cell
		if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
			const pos = map.map[index];
			const attrs = table.nodeAt(pos)!.attrs;
			tr.setNodeMarkup(tableStart + pos, null, {
				...attrs,
				rowspan: attrs.rowspan + 1,
			});
			col += attrs.colspan - 1;
		} else {
			const potentialRefRow = refRow !== null ? table.nodeAt(map.map[index + refRow * map.width]) : null;
			const type = refRow == null ? tableNodeTypes(table.type.schema).cell : potentialRefRow?.type;
			const node = type?.createAndFill(potentialRefRow?.attrs ?? null);
			if (node) cells.push(node);
		}
	}
	tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
	return tr;
}

/**
 * Modified `addRowAfter` to ensure the same alignment
 */
export function addRowAfter(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	if (!isInTable(editorState)) return false;
	if (dispatch) {
		const rect = selectedRect(editorState);
		dispatch(addRow(editorState.tr, rect, rect.bottom));
	}
	return true;
}

/**
 * Modified `addRowBefore` to ensure the same alignment
 * as the reference row
 */
function addRowBefore(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		dispatch(addRow(state.tr, rect, rect.top));
	}
	return true;
}

/**
 * ProseMirror command to add a row before the current selected row.
 * It does nothing if the selected node is not a header row.
 */
export function checkedAddRowBefore(editorState: EditorState, dispatch?: EditorView["dispatch"]): boolean {
	const selection = editorState.selection;
	const currentNode = selection.$from.parent;
	if (currentNode.type === mdSchema.nodes.table_header) {
		return false;
	}
	return addRowBefore(editorState, dispatch);
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

/**
 * Change table column alignment command
 */
export function changeColumnAlignment(alignment: "start" | "center" | "end") {
	return (editorState: EditorState, dispatch?: EditorView["dispatch"]) => {
		const { $from, empty } = editorState.selection;
		const currentNode = $from.parent;
		if (!empty || !currentNode.type.spec.isCell) {
			return false;
		}

		const columnIndex = $from.index($from.depth - 1);
		const tableNode = $from.node($from.depth - 2);
		const tableStartPosition = $from.start($from.depth - 2);
		let transaction = editorState.tr;
		tableNode.descendants((node, position, _, index) => {
			if (node.type.spec.isCell) {
				if (index === columnIndex) {
					transaction = transaction.setNodeAttribute(tableStartPosition + position, "align", alignment);
				}
				return false;
			}
			return true;
		});
		dispatch?.(transaction);
		return true;
	};
}
