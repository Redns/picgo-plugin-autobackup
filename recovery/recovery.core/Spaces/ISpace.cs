namespace recovery.core.Spaces
{
    public interface ISpace
    {
        string GetSpaceName();

        ValueTask<FileStream> GetImageReadStream(string url);
    }
}
