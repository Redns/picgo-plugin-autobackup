using recovery.core.Helpers;
using System.Text.RegularExpressions;

namespace recovery.cmd
{
    internal class Program
    {
        public static async Task Main()
        {
            using var imageReadStream = await new HttpClient().GetStreamAsync("https://image.krins.cloud/NUDT.jpeg");
            using var imageWriteStream = File.OpenWrite("NUDT.jpeg");
            await imageReadStream.CopyToAsync(imageWriteStream, 500 * 1024);
        }
    }
}