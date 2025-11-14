# Windows-Style Open File Dialog

This repository pairs an Angular 17 component with an ASP.NET Web API 2 back end (built on `Microsoft.AspNet.WebApi.Core` 5.2.3) to browse the file system of the machine hosting the API, replicating the UX of the classic Windows "Open File" dialog.

## Projects

- `client/` – Angular front-end containing the `OpenFileDialogComponent`.
- `server/` – ASP.NET Web API 2 self-host (`OpenFileBrowser.Api`).

## Getting started

1. **Backend** (requires the .NET SDK on Windows to run the Web API 2 self-host)
   ```bash
   cd server/OpenFileBrowser.Api
   dotnet run -- http://localhost:5002
   ```
2. **Frontend**
   ```bash
   cd client
   npm install
   npm start
   ```

Update `client/src/environments/environment.ts` if the backend is served from a non-default URL.
