import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileSystemService } from './file-system.service';
import { DirectoryListingResponse, FileEntry, DriveInfo } from '../models/file-entry';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-open-file-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-file-dialog.component.html',
  styleUrl: './open-file-dialog.component.scss'
})
export class OpenFileDialogComponent implements OnInit {
  @Output() fileSelected = new EventEmitter<string>();

  protected drives: DriveInfo[] = [];
  protected directories: FileEntry[] = [];
  protected files: FileEntry[] = [];
  protected breadcrumbs: string[] = [];
  protected activeDirectory: string | null = null;
  protected selectedFile: FileEntry | null = null;
  protected fileFilter = 'All files (*.*)';
  protected filters = ['All files (*.*)', 'Images (*.png;*.jpg)', 'Text (*.txt)'];
  protected isLoading = false;

  constructor(private readonly fileSystem: FileSystemService) {}

  ngOnInit(): void {
    this.loadDrives();
  }

  protected loadDrives() {
    this.withLoading(this.fileSystem.getDrives()).subscribe({
      next: (drives) => {
        this.drives = drives;
        if (drives.length) {
          this.openDirectory(drives[0].path);
        }
      }
    });
  }

  protected openDirectory(path: string | null) {
    this.withLoading(this.fileSystem.listDirectory(path)).subscribe({
      next: (response: DirectoryListingResponse) => {
        this.activeDirectory = response.path;
        this.directories = response.directories;
        this.files = response.files;
        this.breadcrumbs = this.buildBreadcrumbs(response.path);
        this.selectedFile = null;
      }
    });
  }

  protected handleTreeSelect(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  protected handleDirectoryOpen(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  protected handleFileClick(entry: FileEntry) {
    this.selectedFile = entry;
  }

  protected handleConfirm() {
    const file = this.selectedFile;
    if (file) {
      this.fileSelected.emit(file.path);
    }
  }

  protected goUp() {
    const crumbs = this.breadcrumbs;
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
    return this.selectedFile?.path === entry.path;
  }

  protected trackByPath(_: number, entry: FileEntry) {
    return entry.path;
  }

  protected get breadcrumbPath(): string {
    return this.breadcrumbs.join('\\');
  }

  private withLoading<T>(request: Observable<T>) {
    this.isLoading = true;
    return request.pipe(finalize(() => (this.isLoading = false)));
  }
}
