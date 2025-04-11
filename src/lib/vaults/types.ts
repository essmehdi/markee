import BrowserVault from "./browser-vault";
import LocalVault from "./local-vault";

interface BaseVaultItem {
	name: string;
	type: string;
	absolutePath: string;
	createdAt: string;
}

export interface VaultFile extends BaseVaultItem {
	type: "file";
}

export interface VaultDirectory extends BaseVaultItem {
	type: "directory";
	content: VaultItem[] | null;
}

export type VaultItem = VaultFile | VaultDirectory;

export interface BaseVault {
	id: string;
	name: string;
	rename(name: string): Promise<void>;
	renameItem(item: VaultItem, newName: string): Promise<VaultItem>;
	getCachedRootContent(): Promise<VaultItem[]>;
	getRootVaultDirectory(): VaultDirectory;
	getRootContent(): Promise<VaultItem[]>;
	getFileContent(file: VaultFile): Promise<string>;
	writeToFile(file: VaultFile, content: string): Promise<void>;
	expandDirectoryContent(dir: VaultDirectory): Promise<void>;
	createFile(dirPath: VaultDirectory, name: string): Promise<VaultFile>;
	createDirectory(
		dirPath: VaultDirectory,
		name: string,
	): Promise<VaultDirectory>;
	copy(item: VaultItem, destinationDir: VaultDirectory): Promise<VaultItem>;
	move(item: VaultItem, destinationDir: VaultDirectory): Promise<VaultItem>;
	remove(item: VaultItem): Promise<void>;
}

export type Vault = LocalVault | BrowserVault;
export type VaultType = Vault["type"];
