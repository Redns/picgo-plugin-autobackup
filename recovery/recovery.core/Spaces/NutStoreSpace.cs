using recovery.core.Spaces;
using System.Text;

namespace Recovery.Core.Spaces
{
    public class NutStoreSpace : ISpace
    {
        private readonly string _name = "NutStore";

        private readonly HttpClient _httpClient = new();

        public NutStoreSpace(string account, string password)
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes($"{account}:{password}"))}");
        }

        public ValueTask<FileStream> GetImageReadStream(string url)
        {
            
        }

        public string GetSpaceName()
        {
            return _name;
        }
    }
}
