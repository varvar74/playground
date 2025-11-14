import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DirectoryListingResponse, DriveInfo } from '../models/file-entry';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private readonly baseUrl = environment.apiBaseUrl;
  public readonly loading = signal(false);

  constructor(private readonly http: HttpClient) {}

  getDrives(): Observable<DriveInfo[]> {
    this.loading.set(true);
    return this.http
      .get<DriveInfo[]>(`${this.baseUrl}/roots`)
      .pipe(tap(() => this.loading.set(false)));
  }

  listDirectory(path: string | null): Observable<DirectoryListingResponse> {
    this.loading.set(true);
    const url = path ? `${this.baseUrl}?path=${encodeURIComponent(path)}` : this.baseUrl;
    return this.http
      .get<DirectoryListingResponse>(url)
      .pipe(tap(() => this.loading.set(false)));
  }
}
