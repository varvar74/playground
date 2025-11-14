using System.IO;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Http.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = null;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();

app.MapGet("/api/files/roots", () =>
{
    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    {
        return Directory.GetLogicalDrives()
            .Select(path => new DriveInfo(path))
            .Select(drive => new
            {
                Name = string.IsNullOrWhiteSpace(drive.VolumeLabel)
                    ? drive.Name.TrimEnd('\\')
                    : $"{drive.VolumeLabel} ({drive.Name.TrimEnd('\\')})",
                Path = drive.Name.TrimEnd('\\')
            });
    }

    return new[]
    {
        new
        {
            Name = "Root",
            Path = "/"
        }
    };
});

app.MapGet("/api/files", (string? path) =>
{
    var sanitizedPath = string.IsNullOrWhiteSpace(path)
        ? GetDefaultPath()
        : Path.GetFullPath(path);

    if (!Directory.Exists(sanitizedPath))
    {
        return Results.NotFound(new { Message = $"Directory '{sanitizedPath}' not found." });
    }

    var directoryInfo = new DirectoryInfo(sanitizedPath);

    var directories = directoryInfo
        .EnumerateDirectories()
        .Where(dir => (dir.Attributes & FileAttributes.Hidden) == 0)
        .Select(dir => new FileEntryDto(dir.Name, dir.FullName, true, 0, dir.LastWriteTimeUtc));

    var files = directoryInfo
        .EnumerateFiles()
        .Where(file => (file.Attributes & FileAttributes.Hidden) == 0)
        .Select(file => new FileEntryDto(file.Name, file.FullName, false, file.Length, file.LastWriteTimeUtc, file.Extension));

    return Results.Ok(new DirectoryListingResponse
    {
        Path = directoryInfo.FullName,
        ParentPath = directoryInfo.Parent?.FullName,
        Directories = directories,
        Files = files
    });
});

app.Run();

static string GetDefaultPath()
{
    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    {
        return Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    }

    return "/";
}

record FileEntryDto(string Name, string Path, bool IsDirectory, long Size, DateTime LastModified, string? Extension = null);

record DirectoryListingResponse
{
    public string Path { get; init; } = string.Empty;
    public string? ParentPath { get; init; }
    public IEnumerable<FileEntryDto> Directories { get; init; } = Array.Empty<FileEntryDto>();
    public IEnumerable<FileEntryDto> Files { get; init; } = Array.Empty<FileEntryDto>();
}
