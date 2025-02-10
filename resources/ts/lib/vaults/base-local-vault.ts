import { ConflictError, PermissionNotGrantedError, UnsupportedOperationError } from "./errors";
import type { BaseVault, VaultDirectory, VaultItem } from "./types";

/**
 * Local vault that represents a directory in the local file system
 */
export default abstract class BaseLocalVault implements BaseVault {
	public static SUPPORTED_FILE_EXTENSIONS_REGEX = /\.(txt|md)$/i;

	public id: string;
	public name: string;
	protected rootHandle: FileSystemDirectoryHandle;
	protected expandedDirs: Set<string> = new Set();
	protected tree: VaultItem[] | null = null;

	constructor(id: string, name: string, rootHandle: FileSystemDirectoryHandle) {
		this.id = id;
		this.name = name;
		this.rootHandle = rootHandle;
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
	protected async getContent(handle: FileSystemDirectoryHandle, depth: string[]): Promise<VaultItem[]> {
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
						? await this.getContent(await handle.getDirectoryHandle(entry.name), absolutePathArray)
						: null,
				} as VaultDirectory);
			} else {
				// Check if it is a supported file
				if (entry.name.match(BaseLocalVault.SUPPORTED_FILE_EXTENSIONS_REGEX)) {
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
	protected async getFileHandle(filePath: string): Promise<FileSystemFileHandle> {
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
	protected async getDirectoryHandle(dirPath: string): Promise<FileSystemDirectoryHandle> {
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
		const splitFilePath = filePath.split("/");
		if (splitFilePath.length === 1) {
			return await this.rootHandle.removeEntry(filePath);
		}
		const fileName = splitFilePath.pop()!;
		const parentDirPath = splitFilePath.join("/");
		const parentDirHandle = await this.getDirectoryHandle(parentDirPath);
		await parentDirHandle.removeEntry(fileName);
	}

	/**
	 * Copies a file in a specified directory
	 */
	public async copyFile(): Promise<void> {
		throw new UnsupportedOperationError();
	}

	/**
	 * Moves a file in the vault to another directory in the same vault
	 * @param filePath Location of the file to move
	 * @param destinationDirPath Location of the destination directory
	 */
	public async moveFile(): Promise<void> {
		throw new UnsupportedOperationError();
	}
}
