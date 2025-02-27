import type { CustomMarkedToken } from "@/lib/marked";
import marked from "@/lib/marked";
import { MarkedToken, Tokens } from "marked";
import { Fragment, Node, Slice } from "prosemirror-model";
import mdSchema from "../editor-schema";

type TokenHandlerMap = {
	[K in CustomMarkedToken["type"]]?: <T extends Extract<CustomMarkedToken, { type: K }>>(token: T) => Node;
};

const TABLE_CELL_ALIGNMENT_MAP = {
	left: "start",
	center: "center",
	right: "end",
} as const;

const TOKEN_HANDLER_MAP: TokenHandlerMap = {
	code: (token) => {
		return mdSchema.nodes.code.create({ language: token.lang ?? "" }, mdSchema.text(token.text));
	},
	blockquote: (token) => {
		return mdSchema.nodes.blockquote.create(null, deserializeTokens(token.tokens as MarkedToken[]));
	},
	html: (token) => {
		return mdSchema.nodes.html.create(null, mdSchema.text(token.raw));
	},
	table: (token) => {
		return mdSchema.nodes.table.create(null, [
			mdSchema.nodes.table_row.create(
				null,
				token.header.map((headerCell, index) => {
					const cellAttrs = {
						align: token.align[index] ? TABLE_CELL_ALIGNMENT_MAP[token.align[index]] : "start",
					};
					return mdSchema.nodes.table_header.create(cellAttrs, mdSchema.text(headerCell.text));
				})
			),
			...token.rows.map((tableRow) =>
				mdSchema.nodes.table_row.create(
					null,
					tableRow.map((tableCell, index) => {
						const cellAttrs = {
							align: token.align[index] ? TABLE_CELL_ALIGNMENT_MAP[token.align[index]] : "start",
						};
						return tableCell.text === ""
							? mdSchema.nodes.table_cell.createAndFill(cellAttrs)!
							: mdSchema.nodes.table_cell.create(cellAttrs, mdSchema.text(tableCell.text));
					})
				)
			),
		]);
	},
	list: (token) => {
		const listAttrs = token.ordered ? { order: token.start } : null;
		const listType = listAttrs === null ? mdSchema.nodes.bullet_list : mdSchema.nodes.ordered_list;
		return listType.create(
			listAttrs,
			token.items.map((listItem) => {
				const listItemAttrs = listAttrs === null ? { checked: listItem.checked ?? null } : null;
				return mdSchema.nodes.list_item.create(listItemAttrs, deserializeTokens(listItem.tokens as MarkedToken[]));
			})
		);
	},
	mathblock: (token) => {
		return mdSchema.nodes.math_block.create(null, mdSchema.text(token.code));
	},
	hr: () => {
		return mdSchema.nodes.horizontal_rule.createAndFill()!;
	}
};

export function deserializeTokens(tokens: MarkedToken[]): Node[] {
	const docContent: Node[] = [];
	let i = 0;
	while (i < tokens.length) {
		const currentToken = tokens[i] as MarkedToken;
		if (currentToken.type === "heading" || currentToken.type === "paragraph" || currentToken.type === "text") {
			const nodeContent = getTextNodesWithBreaks(currentToken);
			docContent.push(mdSchema.nodes.paragraph.create(null, nodeContent));
		} else {
			const tokenHandler = TOKEN_HANDLER_MAP[currentToken.type];
			if (tokenHandler) {
				// TODO: Fix this type error
				// @ts-expect-error Union types and never madness
				docContent.push(tokenHandler(currentToken));
			}
		}
		i++;
	}
	return docContent;
}

export function getSliceFromMarkdown(markdown: string): Slice {
	const docContent = deserializeTokens(getTokensFromMarkdown(markdown));
	return new Slice(Fragment.from(docContent), 0, 0);
}

export function getNewDocFromMarkdown(markdown: string) {
	const docContent = deserializeTokens(getTokensFromMarkdown(markdown));
	return mdSchema.nodes.doc.create(null, docContent);
}

function getTokensFromMarkdown(markdown: string): MarkedToken[] {
	const tokens = marked.lexer(markdown) as MarkedToken[];
	return tokens;
}

function getTextNodesWithBreaks(token: Tokens.Heading | Tokens.Paragraph | Tokens.Text): Node[] {
	const content = token.type === "heading" ? token.raw.replace(/\s+$/, "") : token.text;
	const result = content
		.split(/(\n)/)
		.map((part) => (part === "\n" ? mdSchema.nodes.soft_break.create() : mdSchema.text(part)));
	return result;
}
