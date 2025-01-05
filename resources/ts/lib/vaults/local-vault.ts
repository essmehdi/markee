import { PromiseExtended } from "dexie";
import { db, SavedVault } from "../db";
import type { Vault, VaultDirectory, VaultItem } from "./types";
import { ConflictError, PermissionNotGrantedError } from "./errors";

/**
 * Local vault that represents a directory in the local file system
 */
export default class LocalVault implements Vault {
	public static SUPPORTED_FILE_EXTENSIONS_REGEX = /\.(txt|md)$/i;

	public id: string;
	public name: string;
	public type = "local";
	private rootHandle: FileSystemDirectoryHandle;
	private expandedDirs: Set<string> = new Set();
	private tree: VaultItem[] | null = null;

	constructor(id: string, name: string, rootHandle: FileSystemDirectoryHandle) {
		this.id = id;
		this.name = name;
		this.rootHandle = rootHandle;
	}

	/**
	 * Gets stored vault in IndexedDB
	 * @param id Vault id
	 * @returns The saved local vault
	 */
	static async getLocalVaultFromIndexedDB(id: string) {
		const savedVault = (await db.vaults.get(id))!;
		return new LocalVault(
			savedVault.id,
			savedVault.name,
			savedVault.rootHandle,
		);
	}

	/**
	 * Gets all the local vaults stored in IndexedDB after initializing them
	 * @returns All initialized local vaults from IndexedDB
	 */
	static async getAllLocalVaultsFromIndexedDB(): Promise<LocalVault[]> {
		const vaults: LocalVault[] = [];
		await db.vaults.each((savedVault) =>
			vaults.push(
				new LocalVault(savedVault.id, savedVault.name, savedVault.rootHandle),
			),
		);
		return vaults;
	}

	/**
	 * Stores a new vault in IndexedDB
	 * @param vault The vault to save
	 * @returns The id of the stored vault
	 */
	static saveNewVault(vault: Omit<SavedVault, "id">): PromiseExtended<string> {
		return db.vaults.add(vault);
	}

	/**
	 * Deletes a vault from IndexedDB by id
	 * @param vaultId The id of the vault to delete
	 */
	static deleteVaultById(vaultId: string): PromiseExtended<void> {
		return db.vaults.delete(vaultId);
	}

	/**
	 * Deletes the vault from IndexedDB
	 */
	public delete() {
		LocalVault.deleteVaultById(this.id);
	}

	/**
	 * Updates the cached vault content tree and returns it
	 * @returns The updated content tree
	 */
	public async getCachedRootContent(): Promise<VaultItem[]> {
		if (this.tree !== null) {
			return this.tree;
		}
		return await this.getRootContent();
	}

	/**
	 * Gets the content of the root directory and updates the content tree
	 * @returns The updated content tree
	 */
	public async getRootContent(): Promise<VaultItem[]> {
		const items: VaultItem[] = await this.getContent(this.rootHandle, []);
		this.tree = items;
		return this.tree;
	}

	/**
	 * Expands a directory and updates the content tree
	 * @param dir The directory to expand
	 */
	public async expandDirectoryContent(dir: string): Promise<void> {
		this.expandedDirs.add(dir);
		await this.getRootContent();
	}

	/**
	 * Gets the content of a directory in the vault
	 * @param handle The directory handle
	 * @param depth The current depth of the parsing
	 * @returns The content of the directory
	 */
	private async getContent(
		handle: FileSystemDirectoryHandle,
		depth: string[],
	): Promise<VaultItem[]> {
		const permission = await this.rootHandle.requestPermission();
		if (permission !== "granted") {
			throw new PermissionNotGrantedError();
		}

		const items: VaultItem[] = [];
		depth = [...depth];
		for await (const entry of handle.values()) {
			const absolutePathArray = depth.concat(entry.name);
			const absolutePath = absolutePathArray.join("/");
			if (entry.kind === "directory") {
				items.push({
					name: entry.name,
					type: "directory",
					createdAt: "",
					absolutePath: absolutePath,
					content: this.expandedDirs.has(absolutePath)
						? await this.getContent(
							await handle.getDirectoryHandle(entry.name),
							absolutePathArray,
						)
						: null,
				} as VaultDirectory);
			} else {
				// Check if it is a supported file
				if (entry.name.match(LocalVault.SUPPORTED_FILE_EXTENSIONS_REGEX)) {
					items.push({
						name: entry.name,
						type: entry.kind,
						createdAt: "",
						absolutePath: absolutePath,
					});
				}
			}
		}

		items.sort((a, b) => {
			if (a.type === "directory" && b.type === "file") {
				return -1;
			} else if (a.type === "file" && b.type === "directory") {
				return 1;
			} else {
				return a.name.localeCompare(b.name);
			}
		});

		return items;
	}

	/**
	 * Gets a file in the vault and returns the file handle
	 * @param filePath File to get
	 */
	private async getFileHandle(filePath: string): Promise<FileSystemFileHandle> {
		const filePathSplit = filePath.split("/");
		const fileName = filePathSplit.pop()!;

		let dirHandle;
		if (filePathSplit.length === 0) {
			// If the file is inside the root
			dirHandle = this.rootHandle;
		} else {
			// Else get the directory handles
			dirHandle = await this.rootHandle.getDirectoryHandle(filePathSplit[0]);
			for (let i = 1; i < filePathSplit.length; i++) {
				const dir = filePathSplit[i];
				dirHandle = await dirHandle.getDirectoryHandle(dir);
			}
		}

		return await dirHandle.getFileHandle(fileName);
	}

	/**
	 * Gets a directory in the vault and returns the file handle
	 * @param dirPath File to get
	 */
	private async getDirectoryHandle(
		dirPath: string,
	): Promise<FileSystemDirectoryHandle> {
		if (dirPath === "/") {
			return this.rootHandle;
		}

		const filePathSplit = dirPath.split("/");
		const fileName = filePathSplit.pop()!;

		let dirHandle;
		if (filePathSplit.length === 0) {
			// If the file is inside the root
			dirHandle = this.rootHandle;
		} else {
			// Else get the directory handles
			dirHandle = await this.rootHandle.getDirectoryHandle(filePathSplit[0]);
			for (let i = 1; i < filePathSplit.length; i++) {
				const dir = filePathSplit[i];
				dirHandle = await dirHandle.getDirectoryHandle(dir);
			}
		}

		return await dirHandle.getDirectoryHandle(fileName);
	}

	/**
	 * Reads a file in the vault and returns its bytes content
	 * @param filePath The file to read
	 * @returns The file content bytes
	 */
	public async getFileContent(filePath: string): Promise<string> {
		const fileHandle = await this.getFileHandle(filePath);
		const file = await fileHandle.getFile();
		return await file.text();
	}

	/**
	 * Writes to file in the vault
	 * @param filePath Path of the file to write in
	 * @param content Data to write
	 */
	public async writeToFile(filePath: string, content: string): Promise<void> {
		const fileHandle = await this.getFileHandle(filePath);
		const writableStream = await fileHandle.createWritable();
		await writableStream.truncate(0);
		await writableStream.write(content);
		await writableStream.close();
	}

	/**
	 * Creates a file in the specified directory
	 * @param dirPath Location where to create the file
	 * @param name Name of the file
	 */
	public async createFile(dirPath: string, name: string): Promise<void> {
		try {
			await this.getFileHandle([dirPath, name].join("/"));
			throw new ConflictError();
		} catch {
			const targetDirectoryHandle = await this.getDirectoryHandle(dirPath);
			targetDirectoryHandle.getFileHandle(name, { create: true });
		}
	}

	/**
	 * Creates a directory in the specified directory
	 * @param dirPath Location where to create the directory
	 * @param name Name of the directory
	 */
	public async createDirectory(dirPath: string, name: string): Promise<void> {
		try {
			await this.getDirectoryHandle([dirPath, name].join("/"));
			throw new ConflictError();
		} catch {
			const targetDirectoryHandle = await this.getDirectoryHandle(dirPath);
			targetDirectoryHandle.getDirectoryHandle(name, { create: true });
		}
	}

	/**
	 * Removes a file in the vault
	 * @param filePath Location of the file to remove
	 */
	public async removeFile(filePath: string): Promise<void> {
		const fileHandle = await this.getFileHandle(filePath);
		// @ts-expect-error This is apparently missing in types :/
		await fileHandle.remove();
	}
}
