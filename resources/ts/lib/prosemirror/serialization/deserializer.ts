import { MarkedToken, Token, Tokens } from "marked";
import marked from "@/lib/marked";
import { Node } from "prosemirror-model";
import mdSchema from "../editor-schema";
import type { CustomMarkedToken } from "@/lib/marked";

type TokenHandlerMap = {
	[K in CustomMarkedToken["type"]]?: <T extends Extract<CustomMarkedToken, { type: K }>>(token: T) => Node;
};

const TOKEN_HANDLER_MAP: TokenHandlerMap = {
	code: (token) => {
		return mdSchema.nodes.code.create({ language: token.lang ?? "" }, mdSchema.text(token.text));
	},
	blockquote: (token) => {
		return mdSchema.nodes.code.createAndFill(null, mdSchema.text(token.text))!;
	},
	html: (token) => {
		return mdSchema.nodes.html.create(null, mdSchema.text(token.raw));
	},
	table: (token) => {
		return mdSchema.nodes.table.create(null, [
			mdSchema.nodes.table_row.create(
				null,
				token.header.map((headerCell) => mdSchema.nodes.table_header.create(null, mdSchema.text(headerCell.text)))
			),
			...token.rows.map((tableRow) =>
				mdSchema.nodes.table_row.create(
					null,
					tableRow.map((tableCell) =>
						tableCell.text === ""
							? mdSchema.nodes.table_cell.createAndFill()!
							: mdSchema.nodes.table_cell.create(null, mdSchema.text(tableCell.text))
					)
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
};

export function deserializeTokens(tokens: MarkedToken[]): Node[] {
	const docContent: Node[] = [];
	let i = 0;
	while (i < tokens.length) {
		const currentToken = tokens[i] as MarkedToken;
		if (currentToken.type === "heading" || currentToken.type === "paragraph" || currentToken.type === "text") {
			const nodeContent = getTextNodesWithBreaks(currentToken);
			let token = currentToken as MarkedToken;
			let j = i;
			while (
				isExtendable(token) &&
				(token = tokens[++j]) &&
				(token.type === "heading" || token.type === "paragraph" || token.type === "text")
			) {
				nodeContent.push(...getTextNodesWithBreaks(token));
			}
			docContent.push(mdSchema.nodes.paragraph.create(null, nodeContent));
			if (j !== i) {
				i = j - 1;
			}
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

export function getNewDocFromMarkdown(markdown: string) {
	const docContent = deserializeTokens(getTokensFromMarkdown(markdown));
	return mdSchema.nodes.doc.create(null, docContent);
}

function getTokensFromMarkdown(markdown: string): MarkedToken[] {
	return marked.lexer(markdown) as MarkedToken[];
}

function isExtendable(token: Token) {
	return token.type === "heading" && !token.raw.endsWith("\n\n");
}

function getTextNodesWithBreaks(token: Tokens.Heading | Tokens.Paragraph | Tokens.Text): Node[] {
	const content = token.type === "heading" ? token.raw.replace(/\s+$/, "") : token.text;
	const result = content
		.split(/(\n)/)
		.map((part) => (part === "\n" ? mdSchema.nodes.soft_break.create() : mdSchema.text(part)));
	return result;
}
