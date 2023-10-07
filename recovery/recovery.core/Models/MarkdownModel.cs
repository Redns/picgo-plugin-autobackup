using recovery.core.Entities;
using recovery.core.Helpers;
using System.Text;

namespace recovery.core.Models
{
    public class MarkdownModel
    {
        /// <summary>
        /// 文档内容
        /// </summary>
        private string _content;

        
        private IEnumerable<ImageComponent>? _images = null;
        public IEnumerable<ImageComponent> Images
        {
            get
            {
                return _images ??= MarkdownHelper.ParseImageComponents(_content);
            }
        }

        public MarkdownModel(string content)
        {
            _content = content;
        }

        public MarkdownModel(string path, Encoding? encoding = null)
        {
            _content = File.ReadAllText(path, encoding ?? Encoding.UTF8);
        }
    }
}
