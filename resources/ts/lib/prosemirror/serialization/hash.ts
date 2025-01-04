import { Node } from "prosemirror-model";

const textEncoder = new TextEncoder();

/**
 * Hashes JSON node data using `sha-1`
 * @param doc Node to hash
 * @returns Hashed JSON node data
 */
export async function getNodeHash(doc: Node): Promise<string> {
	const nodeHash = await crypto.subtle.digest(
		"sha-1",
		textEncoder.encode(JSON.stringify(doc.toJSON()))
	);
	const stringNodeHash = Array.from(new Uint8Array(nodeHash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return stringNodeHash;
}
