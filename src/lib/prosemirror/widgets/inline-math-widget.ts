import katex from "katex";

/**
 * Widget to render inline math
 * @param mathSource The LaTeX source code to render
 * @param preview Render it as floating preview. Adds the md-preview class.
 */
export default function inlineMath(mathSource: string) {
	return () => {
		const widget = document.createElement("span");
		katex.render(mathSource, widget, {
			throwOnError: false,
		});
		return widget;
	};
}
