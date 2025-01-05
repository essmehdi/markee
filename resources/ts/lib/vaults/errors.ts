export class ForbiddenFileError extends Error {
	public message: string = "Unauthorized to access the file(s)";
}

export class PermissionNotGrantedError extends Error {
	public message: string = "Permission not granted";
}

export class IOError extends Error {
	public message: string = "An I/O error occured";
}

export class UnsupportedBrowserError extends Error {
	public message: string = "Your browser does not support managing files";
}

export class ConflictError extends Error {
	public message: string = "File or directory already exists";
}