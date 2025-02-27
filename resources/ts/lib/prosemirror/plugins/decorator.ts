import markdownParser from "@/lib/prosemirror/plugins/parser";
import type { Markup, Position } from "@/lib/prosemirror/types";
import html from "@/lib/prosemirror/widgets/html-widget";
import image from "@/lib/prosemirror/widgets/image-widget";
import inlineMathWidget from "@/lib/prosemirror/widgets/inline-math-widget";
import { EditorState, Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

/** Map for each markup to the its decorations handler that provides ProseMirror decorations */
type MarkupDecorationHandlers = {
	[K in Markup["type"]]: (markup: Extract<Markup, { type: K }>) => Decoration[];
};

/**
 * Generic decorator for simple decorations like bold, italic, etc.
 * where there is simple styling.
 */
function styleDecorator(markup: Markup): Decoration[] {
	const decorationsArray = [];
	if (markup.punctuation.length > 0) {
		const decoClass = `md-${markup.type}`;
		decorationsArray.push(
			Decoration.inline(
				markup.punctuation[0][1],
				markup.punctuation[1]?.[0] ?? markup.context[1],
				{
					class: decoClass,
				},
				{ context: markup.context }
			)
		);
	}

	return decorationsArray;
}

function punctuationDecorator(markup: Markup): Decoration[] {
	const decorationsArray: Decoration[] = [];
	markup.punctuation.forEach((punctuation) => {
		let punctuationClass = "md-punctuation";
		if (markup.type === "html") {
			punctuationClass += " md-" + markup.type;
		}
		decorationsArray.push(
			Decoration.inline(
				punctuation[0],
				punctuation[1],
				{
					class: punctuationClass,
				},
				{ context: markup.context, shouldHide: true }
			)
		);
	});
	return decorationsArray;
}

function genericDecorator(markup: Markup): Decoration[] {
	return [...styleDecorator(markup), ...punctuationDecorator(markup)];
}

/**
 * Map that provides decorations handler for each markup type. The callbacks return
 * the ProseMirror decorations to be displyed in the editor.
 */
const DECORATIONS_MAP: MarkupDecorationHandlers = {
	em: genericDecorator,
	strong: genericDecorator,
	del: genericDecorator,
	heading: (markup) => {
		const decorationsArray = [];
		if (markup.punctuation.length > 0) {
			const decoClass = `md-title-${markup.level} md-title`;
			decorationsArray.push(
				Decoration.inline(
					markup.punctuation[0][1],
					markup.punctuation[1]?.[0] ?? markup.context[1],
					{
						class: decoClass,
					},
					{ context: markup.context }
				)
			);
		}

		markup.punctuation.forEach((punctuation) => {
			let punctuationClass = `md-punctuation md-title-${markup.level} md-title`;
			decorationsArray.push(
				Decoration.inline(
					punctuation[0],
					punctuation[1],
					{
						class: punctuationClass,
						level: markup.level.toString(),
					},
					{ context: markup.context, shouldHide: true }
				)
			);
		});

		return decorationsArray;
	},
	codespan: genericDecorator,
	footnoteref: genericDecorator,
	link: (markup) => {
		const decorationsArray = [...punctuationDecorator(markup)];
		if (markup.punctuation.length > 0) {
			decorationsArray.push(
				Decoration.inline(
					markup.punctuation[1][1],
					markup.punctuation[2][0],
					{
						class: "",
					},
					{ context: markup.context, shouldHide: true }
				)
			);
			decorationsArray.push(
				Decoration.inline(
					markup.punctuation[0][1],
					markup.punctuation[1][0],
					{
						class: "md-link",
						href: markup.href,
						title: markup.title ?? "",
						role: "link",
					},
					{ context: markup.context }
				)
			);
		} else if (markup.punctuation.length === 0) {
			decorationsArray.push(
				Decoration.inline(
					markup.context[0],
					markup.context[1],
					{
						class: "md-link",
						href: markup.href,
						title: markup.title ?? "",
						role: "link",
					},
					{ context: markup.context }
				)
			);
		}
		return decorationsArray;
	},
	image: (markup) => {
		const decorationArray = [...punctuationDecorator(markup)];
		decorationArray.push(
			Decoration.inline(
				markup.punctuation[1][1],
				markup.punctuation[2][0],
				{
					class: "",
				},
				{ context: markup.context, shouldHide: true }
			)
		);
		decorationArray.push(
			Decoration.inline(
				markup.punctuation[0][1],
				markup.punctuation[1][0],
				{
					class: "",
				},
				{ context: markup.context, shouldHide: true }
			)
		);
		decorationArray.push(
			Decoration.widget(markup.context[0], image(markup.url, markup.alt, markup.title), {
				key: `${markup.url}-${markup.alt}-${markup.title}`,
				context: markup.context,
				shouldHide: true,
			})
		);
		return decorationArray;
	},
	inlinemath: (markup) => {
		const decorationsArray = [...punctuationDecorator(markup)];
		decorationsArray.push(
			Decoration.inline(
				markup.punctuation[0][1],
				markup.punctuation[1][0],
				{
					class: `md-inlinemath`,
				},
				{ context: markup.context, shouldHide: true }
			)
		);
		decorationsArray.push(
			Decoration.widget(markup.punctuation[0][1], inlineMathWidget(markup.expression), {
				key: `${markup.expression}`,
				context: markup.context,
			})
		);
		return decorationsArray;
	},
	html: (markup) => {
		const decorationsArray = [...punctuationDecorator(markup)];
		if (markup.style) {
			decorationsArray.push(
				Decoration.inline(
					markup.punctuation[0][1],
					markup.punctuation[1][0],
					{ style: markup.style },
					{ context: markup.context, shouldHide: true }
				)
			);
		} else {
			const styleClasses = markup.decorations.reduce(
				(acc, type) => (["em", "strong", "del", "codespan"].includes(type) ? acc.concat(`md-${type}`) : acc),
				[] as string[]
			);
			decorationsArray.push(
				Decoration.inline(
					markup.context[0],
					markup.context[1],
					{
						class: "md-hidden",
					},
					{ context: markup.context, shouldHide: true }
				)
			);
			decorationsArray.push(
				Decoration.widget(markup.context[0], html(markup.code, styleClasses), {
					context: markup.context,
					shouldHide: true,
				})
			);
		}
		return decorationsArray;
	},
};

const decorator = new Plugin({
	key: new PluginKey("parser"),
	state: {
		init() {
			return DecorationSet.empty;
		},
		apply(tr, old, _, newState) {
			if (tr.docChanged) {
				return getDecorationSet(newState);
			}
			return old;
		},
	},
	props: {
		decorations(state) {
			console.time("Decorator");
			const selection = state.selection;
			let decSet = this.getState(state) ?? DecorationSet.empty;
			const hiddenDecs = decSet.find(
				undefined,
				undefined,
				(spec) => spec.shouldHide && !isSelectionNear(selection, spec.context)
			);
			decSet = decSet.add(
				state.doc,
				hiddenDecs.map((dec) => {
					return Decoration.inline(dec.from, dec.to, { class: "md-hidden" });
				})
			);
			decSet = decSet.remove(hiddenDecs);
			console.timeEnd("Decorator");
			return decSet;
		},
		handleDOMEvents: {
			mousedown(_, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (target.classList.contains("md-link") && target.getAttribute("href")) {
						event.preventDefault();
						return true;
					}
				}
			},
			click(_, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (target.classList.contains("md-link") && target.getAttribute("href")) {
						event.preventDefault();
						window.open(target.getAttribute("href") ?? "", "_blank")?.focus();
						return true;
					} else if (target.classList.contains("md-rendered-image")) {
						const nextSibling = target.nextSibling as HTMLElement | null;
						if (nextSibling?.classList.contains("md-link") && nextSibling?.getAttribute("href")) {
							event.preventDefault();
							window.open(nextSibling.getAttribute("href") ?? "", "_blank")?.focus();
							return true;
						}
					}
				}
			},
		},
	},
});

function getDecorationSet(state: EditorState): DecorationSet {
	const decorationsArray: Decoration[] = [];
	markdownParser.getState(state)?.markups.forEach((markup) => {
		const handler = DECORATIONS_MAP[markup.type];
		if (handler) {
			// @ts-ignore
			decorationsArray.push(...handler(markup));
		}
	});
	return DecorationSet.create(state.doc, decorationsArray);
}

function isSelectionNear(selection: Selection, context: Position): boolean {
	return (
		(selection.anchor <= context[1] && selection.anchor >= context[0]) ||
		(selection.head <= context[1] && selection.head >= context[0]) ||
		(selection.anchor <= context[0] && selection.head >= context[1]) ||
		(selection.head <= context[0] && selection.anchor >= context[1])
	);
}

export default decorator;
