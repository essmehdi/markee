import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import mdSchema from "../editor-schema";

type MarkdownNodeHandlers = {
	[key: string]: (node: Node, parent?: Node, childIndex?: number) => string;
};

const ALIGNMENT_TO_MD_MAP = {
	"start": ":--",
	"center": ":-:",
	"end": "--:"
} as const;

const MD_NODE_HANDLERS: MarkdownNodeHandlers = {
	paragraph: (node) => {
		const nodeText = node.textBetween(0, node.nodeSize - 2, null, (leaf) =>
			leaf.type === mdSchema.nodes.soft_break ? "\n" : ""
		);
		if (nodeText.length === 0) return "\n";
		return nodeText;
	},
	html: (node) => {
		return node.textContent;
	},
	blockquote: (node) => {
		let buffer = "";
		node.descendants((node) => {
			buffer += handleNode(node);
			return false;
		});

		const result = buffer
			.split("\n")
			.map((line) => "> " + line)
			.join("\n");
		return result;
	},
	code: (node) => {
		const code = node.textContent;
		const language = node.attrs.language;
		return `\`\`\`${language}` + "\n" + code + "\n" + "```";
	},
	math_block: (node) => {
		const code = node.textContent;
		return "$$" + "\n" + code + "\n" + "$$";
	},
	bullet_list: (node) => {
		return handleNodeDescendants(node, "\n");
	},
	ordered_list: (node) => {
		return handleNodeDescendants(node, "\n");
	},
	list_item: (node, parent, childIndex) => {
		if (!parent) {
			throw new Error("A list item cannot be present without a parent block");
		}
		const order =
			parent.type.name === "bullet_list"
				? null
				: parent.attrs.order + childIndex;
		const bufferStart =
			parent.type.name === "bullet_list"
				? `- ${
						typeof node.attrs.checked !== "boolean"
							? ""
							: node.attrs.checked
							? "[x] "
							: "[ ] "
				  }`
				: `${order}. `;
		const bufferStartShift = " ".repeat(bufferStart.length);
		let buffer = "";
		buffer += bufferStart;
		buffer += handleNodeDescendants(node, "\n");
		const bufferLines = buffer
			.split("\n")
			.map((line, index) => (index !== 0 ? bufferStartShift + line : line));
		return bufferLines.reduce((acc, line, index) => {
			let toConcat = line;

			if (index !== bufferLines.length - 1) {
				toConcat += "\n";
			}
			return acc + toConcat;
		}, "");
	},
	table: (node) => {
		return handleNodeDescendants(node, '\n');
	},
	table_row: (node, _, childIndex) => {
		let buffer = "| ";
		const colsAlignment: ("start" | "center" | "end" | null)[] = [];
		node.descendants((rowNode, _, __, index) => {
			if (childIndex === 0) {
				colsAlignment.push(rowNode.attrs.align ?? null);
			}
			const cellCode = handleNode(rowNode, node, index);
			if (index === 0) {
				buffer += cellCode;
			} else {
				buffer += " | " + cellCode;
			}
			return false;
		});
		buffer += " |"
		if (childIndex === 0) {
			buffer += '\n| ';
			buffer += colsAlignment.map((alignment) => alignment ? ALIGNMENT_TO_MD_MAP[alignment] : "---").join(" | ")
			buffer += ' |';
		}
		return buffer;
	},
	table_header: (node) => {
		return node.textContent;
	},
	table_cell: (node) => {
		return node.textContent;
	}
};

/**
 * An async version of the {@link getMarkdownFromDoc} function
 */
export async function getMarkdownFromDocAsync(
	editorState: EditorState
): Promise<string> {
	return getMarkdownFromDoc(editorState);
}

/**
 * Transforms the document into a markdown code
 * @param editorState ProseMirror editor view
 */
export function getMarkdownFromDoc(editorState: EditorState): string {
	const doc = editorState.doc;
	return handleNodeDescendants(doc);
}

/**
 * Handles node direct descandants
 * @param node The node to be processed
 */
export function handleNodeDescendants(
	node: Node,
	joinWith: string = "\n\n"
): string {
	const buffer: string[] = [];

	node.descendants((descendantNode, _, __, index) => {
		buffer.push(handleNode(descendantNode, node, index));
		return false;
	});

	return buffer.join(joinWith);
}

/**
 * Handles node using corresponding handler in the node handlers map
 * @param node Node to be processed
 * @param parent Node's parent if applicable
 * @param childIndex Node index under parent if applicable
 * @returns Markdown equivalent
 */
export function handleNode(
	node: Node,
	parent?: Node,
	childIndex?: number
): string {
	return MD_NODE_HANDLERS[node.type.name]?.(node, parent, childIndex) ?? "";
}
