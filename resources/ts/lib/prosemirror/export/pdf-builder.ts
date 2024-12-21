import { EditorView } from "prosemirror-view";
import PDFDocument from "pdfkit";
import FigtreeRegular from "@/lib/pdf/fonts/Figtree-Regular-normal";
import FigtreeBold from "@/lib/pdf/fonts/Figtree-Bold-normal";
import IBMPlexMonoRegular from "@/lib/pdf/fonts/IBMPlexMono-Regular-normal";
import IBMPlexMonoBold from "@/lib/pdf/fonts/IBMPlexMono-Bold-normal";
import { Node } from "prosemirror-model";
import mdSchema from "../editor-schema";

type NodeHandlerMap = {
	[key: keyof typeof mdSchema.nodes]: (
		node: Node,
		document: PDFKit.PDFDocument
	) => void;
};

const NODE_HANDLER: NodeHandlerMap = {
	paragraph: (node, document) => {
		document.fontSize(12).font("Figtree Regular").text(node.textContent);
		document.moveDown();
	},
};

/**
 * Builds a PDF from the ProseMirror markdown document using jsPDF
 * @param editorView The ProseMirror editor view document to build the PDF from
 */
export async function buildPDF(editorView: EditorView) {
	const pdfDocument = new PDFDocument();
	pdfDocument.registerFont("Figtree Regular", FigtreeRegular, "Figtree");
	pdfDocument.registerFont("Figtree Bold", FigtreeBold, "Figtree");
	pdfDocument.registerFont(
		"IBM Plex Mono Regular",
		IBMPlexMonoRegular,
		"IBM Plex Mono"
	);
	pdfDocument.registerFont("IBM Plex Mono Bold", IBMPlexMonoBold, "IBM Plex Mono");

	editorView.state.doc.descendants((node) => {
		const handler = NODE_HANDLER[node.type.name];
		if (handler) {
			handler(node, pdfDocument);
		}
	});

	pdfDocument.end();

	// Download the PDF
	const blob = await new Promise<Blob>((resolve) => {
		const chunks: Uint8Array[] = [];
		pdfDocument.on("data", (chunk) => {
			chunks.push(chunk);
		});

		pdfDocument.on("end", () => {
			resolve(new Blob(chunks, { type: "application/pdf" }));
		});
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "document.pdf";
	link.click();
}
