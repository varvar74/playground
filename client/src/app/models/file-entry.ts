export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  extension?: string;
}

export interface DirectoryListingResponse {
  path: string;
  parentPath: string | null;
  directories: FileEntry[];
  files: FileEntry[];
}

export interface DriveInfo {
  name: string;
  path: string;
}
