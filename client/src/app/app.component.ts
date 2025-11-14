import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenFileDialogComponent } from './open-file-dialog/open-file-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OpenFileDialogComponent],
  template: `
    <div class="app-shell">
      <h1>Server File Browser</h1>
      <app-open-file-dialog (fileSelected)="handleFileSelected($event)"></app-open-file-dialog>
      <p *ngIf="selectedFile" class="selection-summary">
        Selected path: <strong>{{ selectedFile }}</strong>
      </p>
    </div>
  `,
  styles: [
    `
      .app-shell {
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
        background: #f3f3f3;
        min-height: 100vh;
        padding: 2rem;
      }

      h1 {
        font-weight: 500;
        margin-bottom: 1.5rem;
      }

      .selection-summary {
        margin-top: 1rem;
      }
    `
  ]
})
export class AppComponent {
  protected selectedFile: string | null = null;

  protected handleFileSelected(path: string) {
    this.selectedFile = path;
  }
}
