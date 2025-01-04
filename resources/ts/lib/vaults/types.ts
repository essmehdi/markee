export interface VaultItem {
	name: string;
	type: string;
	absolutePath: string;
	createdAt: string;
}

export interface VaultFile extends VaultItem {
	type: "file"
	updatedAt: string;
	getContent: () => Blob;
}

export interface VaultDirectory extends VaultItem {
	type: "directory";
	content: VaultItem[] | null;
}

export interface Vault {
	id: string;
	name: string;
	type: string;
	getTree(): Promise<VaultItem[]>;
	getRootContent(): Promise<VaultItem[]>;
	getFileContent(filePath: string): Promise<string>;
	writeToFile(filePath: string, content: string): Promise<void>;
	expandDirectoryContent(dir: string): Promise<void>;
}