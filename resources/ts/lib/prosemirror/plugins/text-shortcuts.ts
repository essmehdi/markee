import { wrapInList } from "prosemirror-schema-list";
import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";
import { addCommandToTransaction } from "../utils/transactions";

export const CODE_BLOCK_STARTER = /^```([^`].*)?$/m;
export const UNORDERED_LIST_STARTER = /^-\s/m;
export const ORDERED_LIST_STARTER = /^(\d+).\s/m;
export const DOUBLE_BREAK = /\n\n/;
export const QUOTE_STARTER = /^>\s/;
export const MATH_BLOCK_STARTER = /^\$\$\s*$/;

type Shortcut = {
	regex: RegExp;
	ignoreCursor?: boolean;
	transaction: (
		match: RegExpMatchArray,
		editorView: EditorView,
		range: [number, number]
	) => void;
};
const shortcuts: Record<string, Shortcut> = {
	codeBlock: {
		regex: CODE_BLOCK_STARTER,
		transaction: (match, editorView, range) => {
			const transaction = editorView.state.tr.replaceRangeWith(
				match.index === 0 ? range[0] : range[0] - 1, // Replace also the line break
				range[1],
				mdSchema.nodes.code.create({ language: match[1] ?? "" })
			);
			editorView.dispatch(transaction);
		},
	},
	unorderedList: {
		regex: UNORDERED_LIST_STARTER,
		ignoreCursor: true,
		transaction: (match, editorView, range) => {
			let transaction;
			if (match.index === 0) {
				transaction = editorView.state.tr.deleteRange(...range);
			} else {
				transaction = editorView.state.tr
					.deleteRange(range[0] - 1, range[1])
					.split(range[0] - 1);
			}
			const wrapInListCommand = wrapInList(mdSchema.nodes.bullet_list);
			addCommandToTransaction(editorView.state, transaction, wrapInListCommand);
			editorView.dispatch(transaction);
		},
	},
	orderedList: {
		regex: ORDERED_LIST_STARTER,
		ignoreCursor: true,
		transaction: (match, editorView, range) => {
			const startNumber = parseInt(match[1]);
			let transaction;
			if (match.index === 0) {
				transaction = editorView.state.tr.deleteRange(...range);
			} else {
				transaction =
					editorView.state.tr
						.deleteRange(range[0] - 1, range[1])
						.split(range[0])
				;
			}
			const wrapInListCommand = wrapInList(mdSchema.nodes.ordered_list, { order: startNumber });
			addCommandToTransaction(editorView.state, transaction, wrapInListCommand);
			editorView.dispatch(transaction);
		},
	},
	doubleBreak: {
		regex: DOUBLE_BREAK,
		ignoreCursor: true,
		transaction(match, editorView, range) {
			editorView.dispatch(
				editorView.state.tr.deleteRange(...range).split(range[0])
			);
		},
	},
	quote: {
		regex: QUOTE_STARTER,
		ignoreCursor: true,
		transaction(match, editorView, range) {
			const transaction = editorView.state.tr.replaceRangeWith(
				match.index === 0 ? range[0] : range[0] - 1, // Replace also the line break
				range[1],
				mdSchema.nodes.blockquote.createAndFill()!
			);
			editorView.dispatch(transaction);
		},
	},
	mathBlock: {
		regex: MATH_BLOCK_STARTER,
		transaction(match, editorView, range) {
			const transaction = editorView.state.tr.replaceRangeWith(
				match.index === 0 ? range[0] : range[0] - 1, // Replace also the line break
				range[1],
				mdSchema.nodes.math_block.createAndFill()!
			);
			editorView.dispatch(transaction);
		},
	},
};

const textShortcuts = new Plugin({
	view() {
		return {
			update(view) {
				view.state.doc.descendants((node, position) => {
					if (
						node.type !== (view.state.schema as typeof mdSchema).nodes.paragraph
					)
						return (
							node.type ===
								(view.state.schema as typeof mdSchema).nodes.blockquote ||
							node.type ===
								(view.state.schema as typeof mdSchema).nodes.ordered_list ||
							node.type ===
								(view.state.schema as typeof mdSchema).nodes.bullet_list ||
							node.type ===
								(view.state.schema as typeof mdSchema).nodes.list_item
						);

					const nodePosition = position;

					const currentNodeContent = node.textBetween(
						0,
						node.nodeSize - 2,
						null,
						(leafNode) =>
							leafNode.type ===
							(view.state.schema as typeof mdSchema).nodes.soft_break
								? "\n"
								: ""
					);

					const selection = view.state.selection;
					const cursor = nodePosition + 1;

					const shortcutsKeys = Object.keys(shortcuts);
					for (let i = 0; i < shortcutsKeys.length; i++) {
						const shortcutInfo = shortcuts[shortcutsKeys[i]];
						const codeBlockMatch = currentNodeContent.match(shortcutInfo.regex);
						if (codeBlockMatch) {
							const range = [
								cursor + (codeBlockMatch.index ?? 0),
								cursor + (codeBlockMatch.index ?? 0) + codeBlockMatch[0].length,
							];

							const isSelectionNear =
								(selection.anchor <= range[1] &&
									selection.anchor >= range[0]) ||
								(selection.head <= range[1] && selection.head >= range[0]) ||
								(selection.anchor <= range[0] && selection.head >= range[1]) ||
								(selection.head <= range[0] && selection.anchor >= range[1]);

							if (shortcutInfo.ignoreCursor || !isSelectionNear) {
								shortcutInfo.transaction(
									codeBlockMatch,
									view,
									range as [number, number]
								);
							}

							// Once a shortcut is valid, don't check any other shortcut
							break;
						}
					}

					return false;
				});
			},
		};
	},
});

export default textShortcuts;
