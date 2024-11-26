export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type Position = [number, number];

export interface BaseMarkup {
	type: string;
}

export interface PunctuatedMarkup extends BaseMarkup {
	punctuation: Position[];
	context: Position
}

export interface Strong extends PunctuatedMarkup {
	type: "strong";
}

export interface Heading extends PunctuatedMarkup {
	type: "heading";
	level: HeadingLevel;
}

export interface Italic extends PunctuatedMarkup {
	type: "em";
}

export interface CodeSnippet extends PunctuatedMarkup {
	type: "codespan";
}

export interface Strike extends PunctuatedMarkup {
	type: "del";
}

export interface Link extends PunctuatedMarkup {
	type: "link";
	href: string;
	title?: string;
}

export interface InlineMath extends PunctuatedMarkup {
	type: "inlinemath";
	expression: string;
}

export interface FootnoteRef extends PunctuatedMarkup {
	type: "footnoteref";
	label: string;
}

export interface Image extends PunctuatedMarkup {
	type: "image";
	url: string;
	alt: string;
	title: string;
}

export interface HTMLSnippet extends PunctuatedMarkup {
	type: "html",
	code: string;
	style?: string;
	decorations: string[]
}

export type Markup = Strong | Heading | Italic | CodeSnippet | Strike | Link | InlineMath | FootnoteRef | Image | HTMLSnippet;
