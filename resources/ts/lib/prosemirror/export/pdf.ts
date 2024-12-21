import { EditorView } from "prosemirror-view";
import html2canvas from "html2canvas";

export function generatePDF(editorView: EditorView) {
	import("@/lib/pdf").then((pdfImport) => {
		const pdf = pdfImport.default;

		const documentWidth = pdf.internal.pageSize.getWidth();

		const duplicateDoc = editorView.dom.cloneNode(true) as HTMLElement;
		document.body.appendChild(duplicateDoc);
		setDuplicateStyles(duplicateDoc, documentWidth);

		duplicateDoc
			.querySelectorAll(".md-punctuation")
			.forEach((el) => el.remove());

		html2canvas(duplicateDoc).then((canvas) => {
			canvas.style.position = "fixed";
			canvas.style.top = "0";
			canvas.style.left = "0";
			canvas.style.zIndex = "999";
			document.body.append(canvas);
		});

		pdf.html(duplicateDoc, {
			margin: 30,
			callback: (resultPdf) => {
				resultPdf.save("document.pdf");
				// duplicateDoc.remove();
			},
			html2canvas: {
				// scale: 0.5,
				useCORS: true,
				letterRendering: true,
			},
			width: documentWidth,
			windowWidth: documentWidth,
			autoPaging: "text",
		});
	});
}

function setDuplicateStyles(duplicateDoc: HTMLElement, documentWidth: number) {
	duplicateDoc.classList.add("exported");
	duplicateDoc.style.width = `${documentWidth}pt`;
	duplicateDoc.style.padding = "0";
	duplicateDoc.style.margin = "0";
	duplicateDoc.style.position = "fixed";
	duplicateDoc.style.top = "0";
	duplicateDoc.style.left = "0";
	// duplicateDoc.style.zIndex = "-1";
	// duplicateDoc.style.visibility = "hidden";
}

export function browserPrint(editorView: EditorView) {
	import("@/lib/pdf").then((pdfImport) => {
		const pdf = pdfImport.default;

		const documentWidth = pdf.internal.pageSize.getWidth();

		const duplicateDoc = editorView.dom.cloneNode(true) as HTMLElement;
		document.body.appendChild(duplicateDoc);
		setDuplicateStyles(duplicateDoc, documentWidth);

		duplicateDoc
			.querySelectorAll(".md-punctuation")
			.forEach((el) => el.remove());

		window.print();

		duplicateDoc.remove();
	});
}
