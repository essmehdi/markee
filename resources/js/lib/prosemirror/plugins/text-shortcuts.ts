import { wrapInList } from "prosemirror-schema-list";
import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import mdSchema from "../editor-schema";

export const CODE_BLOCK_STARTER = /^```([^`].*)?$/m;
export const UNORDERED_LIST_STARTER = /^-\s/m;
export const ORDERED_LIST_STARTER = /^(\d+).\s/m;
export const DOUBLE_BREAK = /\n\n/;

type Shortcut = {
	regex: RegExp;
	ignoreCursor?: boolean;
	transaction: (match: RegExpMatchArray, editorView: EditorView, range: [number, number]) => void;
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
			if (match.index === 0) {
				editorView.dispatch(editorView.state.tr.deleteRange(...range));
			} else {
				editorView.dispatch(editorView.state.tr.deleteRange(range[0] - 1, range[1]).split(range[0] - 1));
			}
			wrapInList(mdSchema.nodes.bullet_list)(editorView.state, editorView.dispatch);
		},
	},
	orderedList: {
		regex: ORDERED_LIST_STARTER,
		ignoreCursor: true,
		transaction: (match, editorView, range) => {
			const startNumber = parseInt(match[1]);
			if (match.index === 0) {
				editorView.dispatch(editorView.state.tr.deleteRange(...range));
			} else {
				editorView.dispatch(editorView.state.tr.deleteRange(range[0] - 1, range[1]).split(range[0]));
			}
			wrapInList(mdSchema.nodes.ordered_list, { order: startNumber })(editorView.state, editorView.dispatch);
		},
	},
	doubleBreak: {
		regex: DOUBLE_BREAK,
		ignoreCursor: true,
		transaction(match, editorView, range) {
			editorView.dispatch(editorView.state.tr.deleteRange(...range).split(range[0]));
		},
	},
};

const textShortcuts = new Plugin({
	view() {
		return {
			update(view) {
				view.state.doc.descendants((node, position) => {
					if (node.type !== (view.state.schema as typeof mdSchema).nodes.paragraph)
						return (
							node.type === (view.state.schema as typeof mdSchema).nodes.ordered_list ||
							node.type === (view.state.schema as typeof mdSchema).nodes.bullet_list ||
							node.type === (view.state.schema as typeof mdSchema).nodes.list_item
						);

					const nodePosition = position;

					const currentNodeContent = node.textBetween(0, node.nodeSize - 2, null, (leafNode) =>
						leafNode.type === (view.state.schema as typeof mdSchema).nodes.soft_break ? "\n" : ""
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
								(selection.anchor <= range[1] && selection.anchor >= range[0]) ||
								(selection.head <= range[1] && selection.head >= range[0]) ||
								(selection.anchor <= range[0] && selection.head >= range[1]) ||
								(selection.head <= range[0] && selection.anchor >= range[1]);

							if (shortcutInfo.ignoreCursor || !isSelectionNear) {
								shortcutInfo.transaction(codeBlockMatch, view, range as [number, number]);
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
