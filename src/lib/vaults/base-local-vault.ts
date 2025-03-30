import {
	ConflictError,
	PermissionNotGrantedError,
	UnsupportedOperationError,
} from "./errors";
import type { BaseVault, VaultDirectory, VaultFile, VaultItem } from "./types";

export type ItemFilter = {
  fileNameRegex?: RegExp;
  dirNameRegex?: RegExp;
  type?: VaultItem["type"];
};

/**
 * Local vault that represents a directory in the local file system
 */
export default abstract class BaseLocalVault implements BaseVault {
  public static ROOT_DIRECTORY: VaultDirectory = {
    name: "root",
    absolutePath: "/",
    content: [],
    type: "directory",
    createdAt: "",
  };

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
  public async getRootContent(filter?: ItemFilter): Promise<VaultItem[]> {
    const items: VaultItem[] = await this.getContent(
      this.rootHandle,
      [],
      filter
    );
    this.tree = items;
    return this.tree;
  }

  /**
   * Expands a directory and updates the content tree
   * @param dir The directory to expand
   */
  public async expandDirectoryContent(dir: VaultDirectory): Promise<void> {
    this.expandedDirs.add(dir.absolutePath);
    await this.getRootContent();
  }

  /**
   * Gets the content of a directory in the vault
   * @param handle The directory handle
   * @param depth The current depth of the parsing
   * @returns The content of the directory
   */
  protected async getContent(
    handle: FileSystemDirectoryHandle,
    depth: string[],
    filter?: ItemFilter
  ): Promise<VaultItem[]> {
    const permission = await this.rootHandle.requestPermission();
    if (permission !== "granted") {
      return Promise.reject(new PermissionNotGrantedError());
    }

    const items: VaultItem[] = [];
    depth = [...depth];
    for await (const entry of handle.values()) {
      const absolutePathArray = depth.concat(entry.name);
      const absolutePath = absolutePathArray.join("/");
      if (entry.kind === "directory") {
        if (
          !filter ||
          ((filter.dirNameRegex === undefined ||
            entry.name.toLowerCase().match(filter.dirNameRegex) !== null) &&
            (filter.type === undefined || filter.type === "directory"))
        ) {
          items.push({
            name: entry.name,
            type: "directory",
            createdAt: "",
            absolutePath: absolutePath,
            content: this.expandedDirs.has(absolutePath)
              ? await this.getContent(
                  await handle.getDirectoryHandle(entry.name),
                  absolutePathArray,
                  filter
                )
              : null,
          } as VaultDirectory);
        }
      } else {
        if (
          !filter ||
          ((filter.fileNameRegex === undefined ||
            entry.name.toLowerCase().match(filter.fileNameRegex) !== null) &&
            (filter.type === undefined || filter.type === "file"))
        ) {
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
   * Returns a dummy vault item to represent the root directory
   */
  public getRootVaultDirectory(): VaultDirectory {
    return {
      name: "root",
      absolutePath: "/",
      content: [],
      type: "directory",
      createdAt: "",
    };
  }

  /**
   * Gets an item in the vault and returns the handle
   * @param filePath File to get
   */
  protected getHandle(item: VaultItem) {
    if (item.type === "file") {
      return this.getFileHandle(item.absolutePath);
    } else {
      return this.getDirectoryHandle(item.absolutePath);
    }
  }

  /**
   * Gets a file in the vault and returns the file handle
   * @param filePath File to get
   */
  protected async getFileHandle(
    filePath: string
  ): Promise<FileSystemFileHandle> {
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
  protected async getDirectoryHandle(
    dirPath: string
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
   * @param file The file to read
   * @returns The file content bytes
   */
  public async getFileContent(file: VaultItem): Promise<string> {
    const fileHandle = await this.getFileHandle(file.absolutePath);
    const fileObj = await fileHandle.getFile();

    return await fileObj.text();
  }

  /**
   * Writes to file in the vault
   * @param file File to write in
   * @param content Data to write
   */
  public async writeToFile(file: VaultFile, content: string): Promise<void> {
    const fileHandle = await this.getFileHandle(file.absolutePath);
    const writableStream = await fileHandle.createWritable();
    await writableStream.truncate(0);
    await writableStream.write(content);
    await writableStream.close();
  }

  /**
   * Creates a file in the specified directory
   * @param directory Directory where to create the file
   * @param name Name of the file
   */
  public async createFile(
    directory: VaultDirectory,
    name: string
  ): Promise<VaultFile> {
    try {
      await this.getFileHandle([directory.absolutePath, name].join("/"));
      return Promise.reject(new ConflictError());
    } catch {
      const targetDirectoryHandle = await this.getDirectoryHandle(
        directory.absolutePath
      );
      targetDirectoryHandle.getFileHandle(name, { create: true });
      return {
        name,
        type: "file",
        absolutePath:
          directory.absolutePath === "/"
            ? name
            : directory.absolutePath + "/" + name,
        createdAt: "",
      };
    }
  }

  /**
   * Creates a directory in the specified directory
   * @param directory Directory where to create the directory
   * @param name Name of the directory
   */
  public async createDirectory(
    directory: VaultDirectory,
    name: string
  ): Promise<VaultDirectory> {
    try {
      await this.getDirectoryHandle([directory.absolutePath, name].join("/"));
      return Promise.reject(new ConflictError());
    } catch {
      const targetDirectoryHandle = await this.getDirectoryHandle(
        directory.absolutePath
      );
      targetDirectoryHandle.getDirectoryHandle(name, { create: true });
      return {
        name,
        type: "directory",
        absolutePath:
          directory.absolutePath === "/"
            ? name
            : directory.absolutePath + "/" + name,
        createdAt: "",
        content: [],
      };
    }
  }

  /**
   * Removes a file or directory in the vault
   * @param item Item to remove
   */
  public async remove(item: VaultItem): Promise<void> {
    const options = item.type === "directory" ? { recursive: true } : undefined;
    const splitFilePath = item.absolutePath.split("/");
    if (splitFilePath.length === 1) {
      return await this.rootHandle.removeEntry(item.absolutePath, options);
    }
    const fileName = splitFilePath.pop()!;
    const parentDirPath = splitFilePath.join("/");
    const parentDirHandle = await this.getDirectoryHandle(parentDirPath);
    await parentDirHandle.removeEntry(fileName, options);
  }

  /**
   * Copies a file to a specified directory
   * @param source Source file to copy
   * @param destinationDir Destination directory
   */
  public async copy(
    source: VaultItem,
    destinationDir: VaultDirectory
  ): Promise<void> {
    return Promise.reject(new UnsupportedOperationError());
  }

  /**
   * Moves a file in the vault to another directory in the same vault
   * @param source Source file to move
   * @param destinationDir Destination directory
   */
  public async move(
    source: VaultItem,
    destinationDir: VaultDirectory
  ): Promise<void> {
    return Promise.reject(new UnsupportedOperationError());
  }
}
