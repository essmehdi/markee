import LocalVault from "./local-vault";

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

export interface BaseVault {
	id: string;
	name: string;
	getCachedRootContent(): Promise<VaultItem[]>;
	getRootContent(): Promise<VaultItem[]>;
	getFileContent(filePath: string): Promise<string>;
	writeToFile(filePath: string, content: string): Promise<void>;
	expandDirectoryContent(dir: string): Promise<void>;
	createFile(dirPath: string, name: string): Promise<void>;
	createDirectory(dirPath: string, name: string): Promise<void>;
	removeFile(filePath: string): Promise<void>;
}

export type Vault = LocalVault;
