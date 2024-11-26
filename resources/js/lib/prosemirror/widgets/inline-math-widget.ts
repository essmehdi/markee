import katex from "katex";

/**
 * Widget to render inline math
 * @param mathSource The LaTeX source code to render
 */
export default function inlineMath(mathSource: string) {
	return () => {
		const widget = document.createElement("span");
		katex.render(mathSource, widget);
		return widget;
	};
}
