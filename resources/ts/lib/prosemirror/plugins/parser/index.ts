import { Token } from "marked";
import marked from "@/lib/marked";
import { Node, NodeType } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Markup, Position } from "@/lib/prosemirror/types";
import mdSchema from "@/lib/prosemirror/editor-schema";
import html from "@/lib/prosemirror/widgets/html-widget";
import image from "@/lib/prosemirror/widgets/image-widget";
import inlineMathWidget from "@/lib/prosemirror/widgets/inline-math-widget";
import { HTMLToken, processHTMLTokens } from "./html-processor";
import { processTokenForRanges } from "./tokens-processor";

/** Map for each markup to the its decorations handler that provides ProseMirror decorations */
type MarkupDecorationHandlers = {
	[K in Markup["type"]]: (markup: Extract<Markup, { type: K }>) => Decoration[];
};

type Transform = {
	targetType: NodeType;
	token?: Token; // Necessary if the transformation needs info from the token
	position: number;
};

type ParsingResult = {
	markups: Markup[];
	htmlTransforms: Transform[];
};
const EMPTY_RESULT: ParsingResult = { markups: [], htmlTransforms: [] };

/**
 * Tokenize the markdown code and generate decorations for the tokens.
 *
 * Starts by grouping the paragraphs that have no multiline spaces
 * Then each of the grouped paragraphs are tokenized
 *
 * @param nodeEntry The current editor node to decorate
 */
function parse(node: Node): ParsingResult {
	console.time("Parser");
	const markups: Markup[] = [];
	const transforms: Transform[] = [];

	if (node.childCount === 0) {
		return EMPTY_RESULT;
	}

	node.descendants((node, position, parent) => {
		if (
			node.type === mdSchema.nodes.blockquote ||
			node.type === mdSchema.nodes.bullet_list ||
			node.type === mdSchema.nodes.ordered_list ||
			node.type === mdSchema.nodes.list_item ||
			node.type === mdSchema.nodes.table ||
			node.type === mdSchema.nodes.table_row //||
			// node.type === mdSchema.nodes.table_header ||
			// node.type === mdSchema.nodes.table_cell
		) {
			return true;
		}

		if (
			node.type !== mdSchema.nodes.paragraph &&
			node.type !== mdSchema.nodes.table_header &&
			node.type !== mdSchema.nodes.table_cell
		) {
			return false;
		}

		/* The offset is to align the ProseMirror positions with the tokens
		 * analyzer. ProseMirror positioning system includes also the html tags
		 */
		const nodeText = node.textBetween(0, node.nodeSize - 2, null, (leaf) =>
			leaf.type === mdSchema.nodes.soft_break ? "\n" : ""
		);

		if (nodeText.length === 0) {
			return;
		}

		const tokens = marked.lexer(nodeText);
		let cursor = position + 1;
		const htmlStack: HTMLToken[] = [];
		for (const token of tokens) {
			if (token.type === "space") {
				cursor += token.raw.length;
				continue;
			}
			// Transform blocks into appropriate nodes
			if (
				parent &&
				(parent.type === mdSchema.nodes.doc ||
					parent.type === mdSchema.nodes.list_item ||
					parent.type === mdSchema.nodes.blockquote)
			) {
				if (token.type === "html" && node.type !== mdSchema.nodes.html) {
					transforms.push({ targetType: mdSchema.nodes.html, position, token });
				} else if (token.type === "table" && node.type !== mdSchema.nodes.table) {
					transforms.push({
						targetType: mdSchema.nodes.table,
						position: cursor,
						token,
					});
				} else if (token.type === "paragraph" && node.type !== mdSchema.nodes.paragraph) {
					transforms.push({
						targetType: mdSchema.nodes.paragraph,
						position,
						token,
					});
				}
			}
			const [newRanges, newPosition] = processTokenForRanges(token, cursor, [], htmlStack);
			markups.push(...newRanges);
			cursor = newPosition;
		}
		markups.push(...processHTMLTokens(htmlStack));
		return false;
	});

	console.timeEnd("Parser");
	return {
		markups: markups,
		htmlTransforms: transforms,
	};
}

const markdownParser = new Plugin({
	key: new PluginKey("parser"),
	state: {
		init(_, { doc }) {
			return parse(doc);
		},
		apply(tr, old) {
			if (tr.docChanged) {
				return parse(tr.doc);
			}
			return old;
		},
	},
});

/**
 * Gets the nearest markup that wraps the current selection.
 * Since the parser is sequential, the markups are supposed to be sorted by context start position.
 */
export function selectionMarkupPosition(editorState: EditorState, markupType: Markup["type"]): Markup | null {
	const selection = editorState.selection;
	const markups = markdownParser.getState(editorState)?.markups ?? [];
	const filteredMarkups = markups.filter((markup) => {
		return markup.context[0] <= selection.from && markup.type === markupType && markup.context[1] >= selection.to;
	});
	return filteredMarkups.pop() ?? null;
}

export default markdownParser;
