# Open File Browser API

Self-hosted ASP.NET Web API 2 application (built on `Microsoft.AspNet.WebApi.Core` 5.2.3) that exposes the server-side file system for the Angular Open File dialog.

## Run locally

The API targets .NET Framework 4.8 because Web API 2 depends on it. Use the Windows .NET SDK/Visual Studio developer prompt to run:

```bash
cd server/OpenFileBrowser.Api
dotnet run -- http://localhost:5002
```

Pass a different base address as the final argument if you need to listen on another port.

Endpoints:

- `GET /api/files/roots` – Lists drives/root folders.
- `GET /api/files?path={fullPath}` – Lists directories and files inside the given path. Leave `path` empty to return the default user profile (Windows) or `/` (Unix).
