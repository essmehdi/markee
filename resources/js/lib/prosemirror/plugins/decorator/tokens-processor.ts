import { Token, Tokens } from "marked";
import { HTMLToken } from "./html-processor";
import { Heading, HeadingLevel, InlineMath, Markup, Position } from "~/lib/types";

/**
 * Describes markdown markup punctuation
 */
type BasicPunctuationData = {
	char: string;
	count: number | [number, number] | ((token: Token) => number | [number, number]); // Array of numbers is punctuation is asymmetrical
	parseInside?: boolean;
	leftSideOnlyPunctuation?: boolean;
};
export const basicPunctuationData: Record<string, BasicPunctuationData> = {
	strong: {
		char: "*",
		count: 2,
		parseInside: true,
	},
	em: {
		char: "*",
		count: 1,
		parseInside: true,
	},
	codespan: {
		char: "`",
		count: 1,
		parseInside: false,
	},
	del: {
		char: "~",
		count: (token) => {
			return token.raw.startsWith("~~") ? 2 : 1;
		},
		parseInside: true,
	},
	inlinemath: {
		char: "$",
		count: 1,
		parseInside: false,
	},
	heading: {
		char: "#",
		count: (token) => {
			if (token.raw.startsWith("#")) {
				return token.raw.trim().length - (token as Tokens.Heading).text.length;
			}
			return 0; // Deals with the heading with dashes or equals format
		},
		parseInside: true,
		leftSideOnlyPunctuation: true,
	},
};
export const basicDecorators = Object.keys(basicPunctuationData);

/**
 * Decorates the token.
 * This method is called recursively until the token has not nested token that can be decorated.
 *
 * @param token The 'marked' token to be processed
 * @param initCursor The cursor position of the token
 * @param excludedTypes All the token types to skip to avoid infinite processing
 * @param htmlStack A stack to detect
 */
export function processTokenForRanges(
	token: Token,
	initCursor: number,
	excludedTypes: string[],
	htmlStack: HTMLToken[]
): [Markup[], number] {
	const ranges: Markup[] = [];
	const tokenLength = token.raw.length;

	const htmlRawLength = htmlStack.length;
	if (htmlRawLength > 0 && token.type !== "html") {
		htmlStack[htmlRawLength - 1].afterContent = htmlStack[htmlRawLength - 1].afterContent.concat(token.raw);
	}

	let cursor = initCursor;
	if (token.type === "text" || excludedTypes.includes(token.type)) {
		cursor += tokenLength;
		return [ranges, cursor];
	}

	const context = [cursor, cursor + tokenLength] as [number, number];
	if (token.type in basicPunctuationData) {
		const punctuationMetadata = basicPunctuationData[token.type];
		let punctuationCount: number | [number, number];
		if (typeof punctuationMetadata.count === "function") {
			punctuationCount = punctuationMetadata.count(token);
		} else {
			punctuationCount = punctuationMetadata.count;
		}

		let startPunctuation: Position;
		let endPunctuation: Position | null = null;
		if (Array.isArray(punctuationCount)) {
			startPunctuation = [context[0], context[0] + punctuationCount[0]];
			if (!punctuationMetadata.leftSideOnlyPunctuation)
				endPunctuation = [context[1] - punctuationCount[1], context[1]];
		} else {
			startPunctuation = [context[0], context[0] + punctuationCount];
			if (!punctuationMetadata.leftSideOnlyPunctuation)
				endPunctuation = [context[1] - punctuationCount, context[1]];
		}

		const punctuation = [startPunctuation];
		if (endPunctuation) {
			punctuation.push(endPunctuation);
		}

		if ("tokens" in token && token.tokens && token.tokens?.length > 0) {
			let nestedCursor = startPunctuation[1];
			for (const nestedToken of token.tokens) {
				const [newNestedMarkups, newNestedCursor] = processTokenForRanges(
					nestedToken,
					nestedCursor,
					excludedTypes.concat([token.type]),
					htmlStack
				);
				ranges.push(...newNestedMarkups);
				nestedCursor = newNestedCursor;
			}
		}

		const markup: Markup = {
			// @ts-expect-error the token type is guaranteed to fall into that type
			type: token.type,
			punctuation,
			context,
		};

		if (token.type === "inlinemath") {
			(markup as InlineMath).expression = token.expression;
		} else if (token.type === "heading") {
			(markup as Heading).level = token.raw.startsWith("#")
				? ((token.raw.trim().length - 1 - (token as Tokens.Heading).text.length) as HeadingLevel)
				: 1;
		}

		ranges.push(markup);
		cursor = context[1];
	}

	if (token.type === "html") {
		htmlStack.push({
			token,
			afterContent: token.raw,
			position: cursor,
			closing: token.raw.startsWith("</"),
			decorations: excludedTypes,
			consumed: false,
		});
		cursor = context[1];
	} else if (token.type === "paragraph") {
		let nestedCursor = initCursor;
		for (const nestedToken of (token as Tokens.Paragraph).tokens) {
			const [newNestedMarkups, newNestedCursor] = processTokenForRanges(
				nestedToken,
				nestedCursor,
				excludedTypes.concat([token.type]),
				htmlStack
			);
			ranges.push(...newNestedMarkups);
			nestedCursor = newNestedCursor;
		}
	} else if (token.type === "link") {
		let nestedCursor = context[0] + 1;
		for (const nestedToken of token.tokens!) {
			const [newNestedMarkups, newNestedCursor] = processTokenForRanges(
				nestedToken,
				nestedCursor,
				excludedTypes.concat([token.type]),
				htmlStack
			);
			ranges.push(...newNestedMarkups);
			nestedCursor = newNestedCursor;
		}

		// First case is the markdown link with punctuation:
		// [Google](https://google.com)
		//
		// Second case is the link directly:
		// https://google.com
		const punctuation =
			token.raw !== token.href
				? ([
					[context[0], context[0] + 1],
					[nestedCursor, nestedCursor + 2],
					[context[1] - 1, context[1]],
				] as Position[])
				: [];

		ranges.push({
			type: "link",
			href: token.href,
			title: token.title ?? undefined,
			punctuation,
			context,
		});

		cursor = context[1];
	} else if (token.type === "image") {
		const punctuation = [
			[context[0], context[0] + 2],
			[context[0] + 2 + token.text.length, context[0] + 2 + token.text.length + 2],
			[context[1] - 1, context[1]],
		] as Position[];

		ranges.push({
			type: "image",
			url: token.href,
			alt: token.text,
			title: token.title ?? undefined,
			punctuation,
			context,
		});

		cursor = context[1];
	} else if (token.type === "footnoteref") {
		ranges.push({
			type: "footnoteref",
			label: token.label,
			punctuation: [
				[context[0], context[0] + 2],
				[context[1] - 1, context[1]],
			],
			context,
		});

		cursor = context[1];
	}

	return [ranges, cursor];
}
