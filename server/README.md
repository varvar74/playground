# Open File Browser API

Minimal ASP.NET Core API that exposes the server-side file system for the Angular Open File dialog.

## Run locally

```bash
cd server/OpenFileBrowser.Api
dotnet run
```

Endpoints:

- `GET /api/files/roots` – Lists drives/root folders.
- `GET /api/files?path={fullPath}` – Lists directories and files inside the given path. Leave `path` empty to return the default user profile (Windows) or `/` (Unix).
