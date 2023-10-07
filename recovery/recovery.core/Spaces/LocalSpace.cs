using recovery.core.Spaces;

namespace Recovery.Core.Spaces
{
    public class LocalSpace : ISpace
    {
        private readonly string _name = "Local";

        public ValueTask<FileStream> GetImageReadStream(string url)
        {
            return ValueTask.FromResult(File.OpenRead(url));
        }

        public string GetSpaceName()
        {
            return _name;
        }
    }
}
