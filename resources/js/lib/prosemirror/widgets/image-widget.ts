/**
 * Widget to render an inline image
 * @param url Image URL
 * @param alt Image alt. description
 * @param title Image title
 */
export default function image(url: string, alt: string, title?: string) {
	return () => {
		const image = document.createElement("img");
		image.src = url;
		image.alt = alt;
		image.classList.add("md-rendered-image");
		if (title) {
			image.title = title;
		}
		return image;
	};
}
