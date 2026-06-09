using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Supabase;

namespace Task6.Services
{
    public class SupabaseStorageService
    {
        private readonly Client _supabase;
        private readonly string _bucketName = "room-images";
        private readonly ILogger<SupabaseStorageService> _logger;

        public SupabaseStorageService(IConfiguration configuration, ILogger<SupabaseStorageService> logger)
        {
            _logger = logger;
            var supabaseUrl = configuration["Supabase:Url"]!;
            var serviceKey = configuration["Supabase:ServiceKey"]!;

            _supabase = new Client(supabaseUrl, serviceKey);
            _supabase.InitializeAsync().Wait();
        }

        public async Task<string?> UploadImageAsync(Stream fileStream, string fileName, string contentType)
        {
            try
            {
                var bucket = _supabase.Storage.From(_bucketName);

                var uniqueName = $"{Guid.NewGuid()}_{fileName}";

                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                var bytes = memoryStream.ToArray();

                await bucket.Upload(bytes, uniqueName, new Supabase.Storage.FileOptions
                {
                    ContentType = contentType,
                    Upsert = true
                });

                var publicUrl = bucket.GetPublicUrl(uniqueName);

                _logger.LogInformation("Image uploaded successfully: {Url}", publicUrl);

                return publicUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload image to Supabase Storage");
                return null;
            }
        }

        public async Task DeleteImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return;

            try
            {
                var bucket = _supabase.Storage.From(_bucketName);

                var fileName = imageUrl.Split($"/{_bucketName}/").Last();

                await bucket.Remove(new List<string> { fileName });

                _logger.LogInformation("Image deleted successfully: {FileName}", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete image from Supabase Storage: {Url}", imageUrl);
            }
        }
    }
}
