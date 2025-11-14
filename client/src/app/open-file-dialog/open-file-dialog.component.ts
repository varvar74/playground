import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileSystemService } from './file-system.service';
import { DirectoryListingResponse, FileEntry, DriveInfo } from '../models/file-entry';

@Component({
  selector: 'app-open-file-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-file-dialog.component.html',
  styleUrl: './open-file-dialog.component.scss'
})
export class OpenFileDialogComponent implements OnInit {
  @Output() fileSelected = new EventEmitter<string>();

  protected drives = signal<DriveInfo[]>([]);
  protected directories = signal<FileEntry[]>([]);
  protected files = signal<FileEntry[]>([]);
  protected breadcrumbs = signal<string[]>([]);
  protected activeDirectory = signal<string | null>(null);
  protected selectedFile = signal<FileEntry | null>(null);
  protected fileFilter = signal('All files (*.*)');
  protected filters = ['All files (*.*)', 'Images (*.png;*.jpg)', 'Text (*.txt)'];
  protected isLoading = this.fileSystem.loading;

  readonly breadcrumbPath = computed(() => this.breadcrumbs().join('\\'));

  constructor(private readonly fileSystem: FileSystemService) {}

  ngOnInit(): void {
    this.loadDrives();
  }

  protected loadDrives() {
    this.fileSystem.getDrives().subscribe((drives) => {
      this.drives.set(drives);
      if (drives.length) {
        this.openDirectory(drives[0].path);
      }
    });
  }

  protected openDirectory(path: string | null) {
    this.fileSystem.listDirectory(path).subscribe((response: DirectoryListingResponse) => {
      this.activeDirectory.set(response.path);
      this.directories.set(response.directories);
      this.files.set(response.files);
      this.breadcrumbs.set(this.buildBreadcrumbs(response.path));
      this.selectedFile.set(null);
    });
  }

  protected handleTreeSelect(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  protected handleDirectoryOpen(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  protected handleFileClick(entry: FileEntry) {
    this.selectedFile.set(entry);
  }

  protected handleConfirm() {
    const file = this.selectedFile();
    if (file) {
      this.fileSelected.emit(file.path);
    }
  }

  protected goUp() {
    const crumbs = this.breadcrumbs();
    if (crumbs.length > 1) {
      const parentPath = crumbs.slice(0, -1).join('\\');
      this.openDirectory(parentPath);
    }
  }

  protected buildBreadcrumbs(path: string): string[] {
    if (!path) {
      return [];
    }
    const sanitized = path.replace(/\\$/g, '');
    const segments = sanitized.split('\\');
    return segments.filter(Boolean);
  }

  protected isSelected(entry: FileEntry) {
    return this.selectedFile()?.path === entry.path;
  }

  protected trackByPath(_: number, entry: FileEntry) {
    return entry.path;
  }
}
