using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Dependencies;
using Microsoft.Owin.Cors;
using Microsoft.Owin.Hosting;
using Newtonsoft.Json.Serialization;
using Owin;

namespace OpenFileBrowser.Api
{
    public static class Program
    {
        public static void Main(string[] args)
        {
            var baseAddress = args.FirstOrDefault() ?? "http://localhost:5002";

            using (WebApp.Start<Startup>(baseAddress))
            {
                Console.WriteLine($"OpenFileBrowser API running on {baseAddress}");
                Console.WriteLine("Press Ctrl+C to exit.");

                var shutdown = new ManualResetEvent(false);
                Console.CancelKeyPress += (sender, eventArgs) =>
                {
                    eventArgs.Cancel = true;
                    shutdown.Set();
                };

                shutdown.WaitOne();
            }
        }
    }

    public sealed class Startup
    {
        public void Configuration(IAppBuilder appBuilder)
        {
            var config = new HttpConfiguration();
            config.MapHttpAttributeRoutes();
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            config.Formatters.JsonFormatter.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;

            config.EnableCors(new EnableCorsAttribute("*", "*", "*"));
            config.DependencyResolver = new SimpleDependencyResolver(new FileSystemBrowser());

            appBuilder.UseCors(CorsOptions.AllowAll);
            appBuilder.UseWebApi(config);
        }
    }

    public sealed class FilesController : ApiController
    {
        private readonly IFileSystemBrowser _browser;

        public FilesController(IFileSystemBrowser browser)
        {
            _browser = browser;
        }

        [HttpGet]
        [Route("api/files/roots")]
        public IHttpActionResult GetRoots()
        {
            return Ok(_browser.GetRoots());
        }

        [HttpGet]
        [Route("api/files")]
        public IHttpActionResult GetDirectory([FromUri] string path = null)
        {
            var listing = _browser.GetDirectory(path);
            if (listing == null)
            {
                return NotFound();
            }

            return Ok(listing);
        }
    }

    public interface IFileSystemBrowser
    {
        IEnumerable<FileEntryDto> GetRoots();
        DirectoryListingResponse GetDirectory(string path);
    }

    public sealed class FileSystemBrowser : IFileSystemBrowser
    {
        public IEnumerable<FileEntryDto> GetRoots()
        {
            if (IsWindows())
            {
                return DriveInfo.GetDrives()
                    .Select(drive =>
                    {
                        var name = string.IsNullOrWhiteSpace(drive.VolumeLabel)
                            ? drive.Name.TrimEnd('\\')
                            : $"{drive.VolumeLabel} ({drive.Name.TrimEnd('\\')})";

                        return new FileEntryDto
                        {
                            Name = name,
                            Path = drive.Name.TrimEnd('\\'),
                            IsDirectory = true
                        };
                    });
            }

            return new[]
            {
                new FileEntryDto
                {
                    Name = "Root",
                    Path = "/",
                    IsDirectory = true
                }
            };
        }

        public DirectoryListingResponse GetDirectory(string path)
        {
            string sanitizedPath;
            try
            {
                sanitizedPath = string.IsNullOrWhiteSpace(path)
                    ? GetDefaultPath()
                    : Path.GetFullPath(path);
            }
            catch (Exception)
            {
                return null;
            }

            if (!Directory.Exists(sanitizedPath))
            {
                return null;
            }

            var directoryInfo = new DirectoryInfo(sanitizedPath);

            IEnumerable<FileEntryDto> directories;
            try
            {
                directories = directoryInfo
                    .EnumerateDirectories()
                    .Where(dir => (dir.Attributes & FileAttributes.Hidden) == 0)
                    .Select(dir => new FileEntryDto
                    {
                        Name = dir.Name,
                        Path = dir.FullName,
                        IsDirectory = true,
                        LastModified = dir.LastWriteTimeUtc
                    })
                    .ToList();
            }
            catch (UnauthorizedAccessException)
            {
                directories = Array.Empty<FileEntryDto>();
            }

            IEnumerable<FileEntryDto> files;
            try
            {
                files = directoryInfo
                    .EnumerateFiles()
                    .Where(file => (file.Attributes & FileAttributes.Hidden) == 0)
                    .Select(file => new FileEntryDto
                    {
                        Name = file.Name,
                        Path = file.FullName,
                        IsDirectory = false,
                        Size = file.Length,
                        LastModified = file.LastWriteTimeUtc,
                        Extension = file.Extension
                    })
                    .ToList();
            }
            catch (UnauthorizedAccessException)
            {
                files = Array.Empty<FileEntryDto>();
            }

            return new DirectoryListingResponse
            {
                Path = directoryInfo.FullName,
                ParentPath = directoryInfo.Parent?.FullName,
                Directories = directories,
                Files = files
            };
        }

        private static bool IsWindows()
        {
            var platform = Environment.OSVersion.Platform;
            return platform == PlatformID.Win32NT || platform == PlatformID.Win32S || platform == PlatformID.Win32Windows;
        }

        private static string GetDefaultPath()
        {
            return IsWindows()
                ? Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)
                : "/";
        }
    }

    public sealed class FileEntryDto
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public bool IsDirectory { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string Extension { get; set; }
    }

    public sealed class DirectoryListingResponse
    {
        public string Path { get; set; } = string.Empty;
        public string ParentPath { get; set; }
        public IEnumerable<FileEntryDto> Directories { get; set; } = Array.Empty<FileEntryDto>();
        public IEnumerable<FileEntryDto> Files { get; set; } = Array.Empty<FileEntryDto>();
    }

    public sealed class SimpleDependencyResolver : IDependencyResolver
    {
        private readonly IFileSystemBrowser _browser;

        public SimpleDependencyResolver(IFileSystemBrowser browser)
        {
            _browser = browser;
        }

        public object GetService(Type serviceType)
        {
            if (serviceType == typeof(FilesController))
            {
                return new FilesController(_browser);
            }

            if (serviceType == typeof(IFileSystemBrowser))
            {
                return _browser;
            }

            return null;
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            var service = GetService(serviceType);
            return service == null ? Array.Empty<object>() : new[] { service };
        }

        public IDependencyScope BeginScope()
        {
            return new SimpleDependencyResolver(_browser);
        }

        public void Dispose()
        {
        }
    }
}
