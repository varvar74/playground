import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryListingResponse, DriveInfo } from '../models/file-entry';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getDrives(): Observable<DriveInfo[]> {
    return this.http.get<DriveInfo[]>(`${this.baseUrl}/roots`);
  }

  listDirectory(path: string | null): Observable<DirectoryListingResponse> {
    const url = path ? `${this.baseUrl}?path=${encodeURIComponent(path)}` : this.baseUrl;
    return this.http.get<DirectoryListingResponse>(url);
  }
}
