import { Token } from "marked";
import marked from "@/lib/marked";
import { Node, NodeType } from "prosemirror-model";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Markup } from "@/lib/prosemirror/types";
import mdSchema from "@/lib/prosemirror/editor-schema";
import html from "@/lib/prosemirror/widgets/html-widget";
import image from "@/lib/prosemirror/widgets/image-widget";
import inlineMathWidget from "@/lib/prosemirror/widgets/inline-math-widget";
import { HTMLToken, processHTMLTokens } from "./html-processor";
import { processTokenForRanges } from "./tokens-processor";

/** Map for each markup to the its decorations handler that provides ProseMirror decorations */
type MarkupDecorationHandlers = {
	[K in Markup["type"]]: (
		markup: Extract<Markup, { type: K }>,
		isSelectionNear: boolean
	) => Decoration[];
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
function decorate(node: Node): ParsingResult {
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
				} else if (
					token.type === "table" &&
					node.type !== mdSchema.nodes.table
				) {
					transforms.push({
						targetType: mdSchema.nodes.table,
						position: cursor,
						token,
					});
				} else if (
					token.type === "paragraph" &&
					node.type !== mdSchema.nodes.paragraph
				) {
					transforms.push({
						targetType: mdSchema.nodes.paragraph,
						position,
						token,
					});
				}
			}
			const [newRanges, newPosition] = processTokenForRanges(
				token,
				cursor,
				[],
				htmlStack
			);
			markups.push(...newRanges);
			cursor = newPosition;
		}
		markups.push(...processHTMLTokens(htmlStack));
		return false;
	});

	return {
		markups: markups,
		htmlTransforms: transforms,
	};
}

/**
 * Generic decorator for simple decorations like bold, italic, etc.
 * where there is simple styling.
 */
function styleDecorator(
	markup: Markup,
	isSelectionNear: boolean
): Decoration[] {
	const decorationsArray = [];
	if (markup.punctuation.length > 0) {
		const decoClass = `md-${markup.type}`;
		decorationsArray.push(
			Decoration.inline(
				markup.punctuation[0][1],
				markup.punctuation[1]?.[0] ?? markup.context[1],
				{
					class: decoClass,
				}
			)
		);
	}

	return decorationsArray;
}

function punctuationDecorator(
	markup: Markup,
	isSelectionNear: boolean
): Decoration[] {
	const decorationsArray: Decoration[] = [];
	markup.punctuation.forEach((punctuation) => {
		let punctuationClass = "md-punctuation";
		if (!isSelectionNear) {
			punctuationClass = punctuationClass.concat(" md-hidden");
		}
		decorationsArray.push(
			Decoration.inline(punctuation[0], punctuation[1], {
				class: punctuationClass,
			})
		);
	});
	return decorationsArray;
}

function genericDecorator(
	markup: Markup,
	isSelectionNear: boolean
): Decoration[] {
	return [
		...styleDecorator(markup, isSelectionNear),
		...punctuationDecorator(markup, isSelectionNear),
	];
}

/**
 * Map that provides decorations handler for each markup type. The callbacks return
 * the ProseMirror decorations to be displyed in the editor.
 */
const DECORATIONS_MAP: MarkupDecorationHandlers = {
	em: genericDecorator,
	strong: genericDecorator,
	del: genericDecorator,
	heading: (markup, isSelectionNear) => {
		const decorationsArray = [];
		if (markup.punctuation.length > 0) {
			const decoClass = `md-title-${markup.level} md-title`;
			decorationsArray.push(
				Decoration.inline(
					markup.punctuation[0][1],
					markup.punctuation[1]?.[0] ?? markup.context[1],
					{
						class: decoClass,
					}
				)
			);
		}

		markup.punctuation.forEach((punctuation) => {
			let punctuationClass = `md-punctuation md-title-${markup.level} md-title`;
			if (!isSelectionNear) {
				punctuationClass = punctuationClass.concat(" md-hidden");
			}
			decorationsArray.push(
				Decoration.inline(punctuation[0], punctuation[1], {
					class: punctuationClass,
					level: markup.level.toString(),
				})
			);
		});

		return decorationsArray;
	},
	codespan: genericDecorator,
	footnoteref: genericDecorator,
	link: (markup, isSelectionNear) => {
		const decorationsArray = [...punctuationDecorator(markup, isSelectionNear)];
		if (markup.punctuation.length > 0 && !isSelectionNear) {
			decorationsArray.push(
				Decoration.inline(markup.punctuation[1][1], markup.punctuation[2][0], {
					class: "md-hidden",
				})
			);
			decorationsArray.push(
				Decoration.inline(markup.punctuation[0][1], markup.punctuation[1][0], {
					class: "md-link",
					href: markup.href,
					title: markup.title ?? "",
					role: "link",
				})
			);
		} else if (markup.punctuation.length === 0) {
			decorationsArray.push(
				Decoration.inline(markup.context[0], markup.context[1], {
					class: "md-link",
					href: markup.href,
					title: markup.title ?? "",
					role: "link",
				})
			);
		}
		return decorationsArray;
	},
	image: (markup, isSelectionNear) => {
		const decorationArray = [...punctuationDecorator(markup, isSelectionNear)];
		if (!isSelectionNear) {
			decorationArray.push(
				Decoration.inline(markup.punctuation[1][1], markup.punctuation[2][0], {
					class: "md-hidden",
				})
			);
			decorationArray.push(
				Decoration.inline(markup.punctuation[0][1], markup.punctuation[1][0], {
					class: "md-hidden",
				})
			);
			decorationArray.push(
				Decoration.widget(
					markup.context[0],
					image(markup.url, markup.alt, markup.title),
					{
						key: `${markup.url}-${markup.alt}-${markup.title}`
					}
				)
			);
		}
		return decorationArray;
	},
	inlinemath: (markup, isSelectionNear) => {
		const decorationsArray = [...punctuationDecorator(markup, isSelectionNear)];
		decorationsArray.push(
			Decoration.inline(markup.punctuation[0][1], markup.punctuation[1][0], {
				class: `md-inlinemath${isSelectionNear ? "" : " md-hidden"}`,
			})
		);
		decorationsArray.push(
			Decoration.widget(
				markup.punctuation[0][1],
				inlineMathWidget(markup.expression, isSelectionNear),
				{
					key: `${markup.expression}-${isSelectionNear}`,
				}
			)
		);
		return decorationsArray;
	},
	html: (markup, isSelectionNear) => {
		const decorationsArray = [...punctuationDecorator(markup, isSelectionNear)];
		if (!isSelectionNear) {
			if (markup.style) {
				decorationsArray.push(
					Decoration.inline(
						markup.punctuation[0][1],
						markup.punctuation[1][0],
						{ style: markup.style }
					)
				);
			} else {
				const styleClasses = markup.decorations.reduce(
					(acc, type) =>
						["em", "strong", "del", "codespan"].includes(type)
							? acc.concat(`md-${type}`)
							: acc,
					[] as string[]
				);
				decorationsArray.push(
					Decoration.inline(markup.context[0], markup.context[1], {
						class: "md-hidden",
					})
				);
				decorationsArray.push(
					Decoration.widget(markup.context[0], html(markup.code, styleClasses))
				);
			}
		}
		return decorationsArray;
	},
};

const markdownParser = new Plugin({
	key: new PluginKey("parser"),
	state: {
		init(_, { doc }) {
			return decorate(doc);
		},
		apply(tr, old) {
			if (tr.docChanged) {
				return decorate(tr.doc);
			}
			return old;
		},
	},
	props: {
		decorations(state) {
			console.time("Decorator");
			const selection = state.selection;
			const parsingResult = this.getState(state) ?? EMPTY_RESULT;

			const decorationArray: Decoration[] = [];
			parsingResult.markups.forEach((markup) => {
				const isSelectionNear =
					(selection.anchor <= markup.context[1] &&
						selection.anchor >= markup.context[0]) ||
					(selection.head <= markup.context[1] &&
						selection.head >= markup.context[0]) ||
					(selection.anchor <= markup.context[0] &&
						selection.head >= markup.context[1]) ||
					(selection.head <= markup.context[0] &&
						selection.anchor >= markup.context[1]);

				const markupDecorationHandler = DECORATIONS_MAP[markup.type];
				decorationArray.push(
					// @ts-expect-error Union type and never madness
					...markupDecorationHandler(markup, isSelectionNear)
				);
			});

			console.timeEnd("Decorator");
			return DecorationSet.create(state.doc, decorationArray);
		},
		handleDOMEvents: {
			mousedown(_, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (
						target.classList.contains("md-link") &&
						target.getAttribute("href")
					) {
						event.preventDefault();
						return true;
					}
				}
			},
			click(_, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (
						target.classList.contains("md-link") &&
						target.getAttribute("href")
					) {
						event.preventDefault();
						window.open(target.getAttribute("href") ?? "", "_blank")?.focus();
						return true;
					} else if (target.classList.contains("md-rendered-image")) {
						const nextSibling = target.nextSibling as HTMLElement | null;
						if (
							nextSibling?.classList.contains("md-link") &&
							nextSibling?.getAttribute("href")
						) {
							event.preventDefault();
							window
								.open(nextSibling.getAttribute("href") ?? "", "_blank")
								?.focus();
							return true;
						}
					}
				}
			},
		},
	},
});

/**
 * Gets the nearest markup that wraps the current selection.
 * Since the parser is sequential, the markups are supposed to be sorted by context start position.
 */
export function selectionMarkupPosition(
	editorState: EditorState,
	markupType: Markup["type"]
): Markup | null {
	const selection = editorState.selection;
	const markups = markdownParser.getState(editorState)?.markups ?? [];
	const filteredMarkups = markups.filter((markup) => {
		return (
			markup.context[0] <= selection.from &&
			markup.type === markupType &&
			markup.context[1] >= selection.to
		);
	});
	return filteredMarkups.pop() ?? null;
}

export default markdownParser;
