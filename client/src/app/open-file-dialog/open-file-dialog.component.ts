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

  drives: DriveInfo[] = [];
  directories: FileEntry[] = [];
  files: FileEntry[] = [];
  breadcrumbs: string[] = [];
  activeDirectory: string | null = null;
  selectedFile: FileEntry | null = null;
  fileFilter = 'All files (*.*)';
  filters = ['All files (*.*)', 'Images (*.png;*.jpg)', 'Text (*.txt)'];
  isLoading = false;

  constructor(private readonly fileSystem: FileSystemService) {}

  ngOnInit(): void {
    this.loadDrives();
  }

  loadDrives() {
    this.withLoading(this.fileSystem.getDrives()).subscribe({
      next: (drives) => {
        this.drives = drives;
        if (drives.length) {
          this.openDirectory(drives[0].path);
        }
      }
    });
  }

  openDirectory(path: string | null) {
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

  handleTreeSelect(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  handleDirectoryOpen(entry: FileEntry) {
    this.openDirectory(entry.path);
  }

  handleFileClick(entry: FileEntry) {
    this.selectedFile = entry;
  }

  handleConfirm() {
    const file = this.selectedFile;
    if (file) {
      this.fileSelected.emit(file.path);
    }
  }

  goUp() {
    const crumbs = this.breadcrumbs;
    if (crumbs.length > 1) {
      const parentPath = crumbs.slice(0, -1).join('\\');
      this.openDirectory(parentPath);
    }
  }

  buildBreadcrumbs(path: string): string[] {
    if (!path) {
      return [];
    }
    const sanitized = path.replace(/\\$/g, '');
    const segments = sanitized.split('\\');
    return segments.filter(Boolean);
  }

  isSelected(entry: FileEntry) {
    return this.selectedFile?.path === entry.path;
  }

  trackByPath(_: number, entry: FileEntry) {
    return entry.path;
  }

  get breadcrumbPath(): string {
    return this.breadcrumbs.join('\\');
  }

  private withLoading<T>(request: Observable<T>) {
    this.isLoading = true;
    return request.pipe(finalize(() => (this.isLoading = false)));
  }
}
