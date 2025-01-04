import { EditorView } from "prosemirror-view";
import PDFDocument from "pdfkit";
import FigtreeRegular from "@/lib/pdf/fonts/Figtree-Regular-normal";
import FigtreeBold from "@/lib/pdf/fonts/Figtree-Bold-normal";
import IBMPlexMonoRegular from "@/lib/pdf/fonts/IBMPlexMono-Regular-normal";
import IBMPlexMonoBold from "@/lib/pdf/fonts/IBMPlexMono-Bold-normal";
import { Node } from "prosemirror-model";
import mdSchema from "../editor-schema";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Content, ContentText, TDocumentDefinitions } from "pdfmake/interfaces";
import markdownParser from "../plugins/parser";
import { Markup, Position } from "../types";

type NodeHandlerMap = {
	[key: keyof typeof mdSchema.nodes]: (
		node: Node,
		nodePosition: number,
		markups: Markup[],
		docDefinition: TDocumentDefinitions
	) => void;
};

type RangesMarkupMap = {
	markups: Markup[];
	range: [number, number];
};

const SIMPLE_MARKUP_TYPES = ["strong", "em", "del", "codespan"];

const NODE_HANDLER: NodeHandlerMap = {
	paragraph: (node, nodePosition, markups, document) => {
		console.log("Handling paragraph node", node, nodePosition);
		const filteredMarkups = getNodeMarkups(node, nodePosition, markups);
		console.log("Detected markups", filteredMarkups);

		const nodeText = node.textBetween(0, node.nodeSize - 2, null, (leaf) =>
			leaf.type === mdSchema.nodes.soft_break ? "\n" : ""
		);

		nodePosition = nodePosition + 1; // Skip the opening tag

		const content: ContentText = { text: [] };
		const ranges: RangesMarkupMap[] = [];
		for (let i = 0; i < filteredMarkups.length; i++) {
			const markup = filteredMarkups[i];

			if (ranges.length === 0 || ranges.at(-1)!.range[1] <= markup.context[0]) {
				ranges.push({ markups: [markup], range: markup.context });
				continue;
			}

			const lastRange = ranges.pop()!;
			const rangeArray: RangesMarkupMap[] = [
				{
					markups: lastRange?.markups,
					range: [lastRange.range[0], markup.context[0]],
				},
				{
					markups: [...lastRange?.markups, markup],
					range: [
						markup.context[0],
						Math.min(markup.context[1], lastRange.range[1]),
					],
				},
			];
			if (lastRange.range[1] < markup.context[1]) {
				rangeArray.push({
					markups: [markup],
					range: [lastRange.range[1], markup.context[1]],
				});
			} else if (lastRange.range[1] > markup.context[1]) {
				rangeArray.push({
					markups: lastRange.markups,
					range: [markup.context[1], lastRange.range[1]],
				});
			}
			ranges.push(...rangeArray);
		}

		console.log("Processed markups", ranges);

		let cursor = 0;
		for (let i = 0; i < ranges.length; i++) {
			const markupRange = ranges[i];
			if (cursor < markupRange.range[0]) {
				(content.text as Content[]).push(
					nodeText.slice(cursor, markupRange.range[0])
				);
				cursor = markupRange.range[0];
			}
			const lastMarkup = markupRange.markups.at(-1)!;
			let textRange: [number, number] = [0,0];
			if (SIMPLE_MARKUP_TYPES.includes(lastMarkup.type)) {
				textRange = [
					Math.max(lastMarkup.punctuation[0][1], markupRange.range[0]/*  + punctuationPositionLength(lastMarkup.punctuation[0]) */),
					Math.min(lastMarkup.punctuation[1][0], markupRange.range[1]/*  - punctuationPositionLength(lastMarkup.punctuation[1]) */),
				];
			} else if (lastMarkup.type === "heading") {
				if (lastMarkup.punctuation[0][0] === lastMarkup.context[0]) {
					textRange = [
						Math.max(lastMarkup.punctuation[0][1], markupRange.range[0]/*  + punctuationPositionLength(lastMarkup.punctuation[0]) */),
						lastMarkup.punctuation[1][0],
					];
				} else {
					textRange = [
						Math.max(lastMarkup.punctuation[0][1], markupRange.range[0]/*  + punctuationPositionLength(lastMarkup.punctuation[0]) */),
						Math.min(lastMarkup.punctuation[1][0], markupRange.range[1]/*  - punctuationPositionLength(lastMarkup.punctuation[1]) */),
					];
				}
			}
			(content.text as Content[]).push({
				// text: nodeText.slice(...markupRange.range),
				text: nodeText.slice(...textRange),
				style: markupRange.markups.map((m) => m.type),
			});
			cursor = markupRange.range[1];
		}

		(document.content as Content[]).push(content);
	},
};

function punctuationPositionLength(position: Position) {
	return position[1] - position[0];
}

const PDF_STYLES: TDocumentDefinitions["styles"] = {
	"header-1": {
		fontSize: 24,
		bold: true,
	},
	"header-2": {
		fontSize: 20,
		bold: true,
	},
	"header-3": {
		fontSize: 18,
		bold: true,
	},
	"header-4": {
		fontSize: 16,
		bold: true,
	},
	"header-5": {
		fontSize: 14,
		bold: true,
	},
	"header-6": {
		fontSize: 12,
		bold: true,
	},
	strong: {
		bold: true,
	},
	em: {
		italics: true,
	},
	del: {
		decoration: "lineThrough",
	},
};

export async function buildPDFMake(editorView: EditorView) {
	(<any>pdfMake).addVirtualFileSystem(pdfFonts);
	const docDefinition = generateDocDefinition(editorView);
	pdfMake.createPdf(docDefinition).open();
}

function generateDocDefinition(editorView: EditorView): TDocumentDefinitions {
	const docDefinition: TDocumentDefinitions = {
		content: [],
		styles: PDF_STYLES,
	};

	const markup = markdownParser.getState(editorView.state)?.markups ?? [];

	editorView.state.doc.descendants((node, position) => {
		const handler = NODE_HANDLER[node.type.name];
		if (handler) {
			handler(node, position, markup, docDefinition);
		}
		return false;
	});

	return docDefinition;
}

function getNodeMarkups(
	node: Node,
	nodePosition: number,
	markups: Markup[]
): Markup[] {
	const filteredMarkups = [];
	for (let i = 0; i < markups.length; i++) {
		const markup = markups[i];
		if (
			markup.context[0] < nodePosition &&
			markup.context[0] > nodePosition + node.nodeSize
		) {
			continue;
		}

		for (let j = 0; j < markup.punctuation.length; j++) {
			const punctuation = markup.punctuation[j];

			punctuation[0] = punctuation[0] - nodePosition - 1;
			punctuation[1] = punctuation[1] - nodePosition - 1;
		}

		markup.context[0] = markup.context[0] - nodePosition - 1;
		markup.context[1] = markup.context[1] - nodePosition - 1;

		filteredMarkups.push(markup);
	}

	return filteredMarkups.sort((a, b) => a.context[0] - b.context[0]);
}
