import katex from "katex";

/**
 * Widget to render inline math
 * @param mathSource The LaTeX source code to render
 * @param preview Render it as floating preview. Adds the md-preview class.
 */
export default function inlineMath(mathSource: string, preview: boolean) {
	return () => {
		const widget = document.createElement("span");
		let renderTarget = widget;
		if (preview) {
			const previewBubble = document.createElement("div");
			widget.append(previewBubble);
			widget.classList.add("md-inlinemath-preview");
			renderTarget = previewBubble;
		}
		katex.render(mathSource, renderTarget, {
			throwOnError: false,
		});
		return widget;
	};
}
