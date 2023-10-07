using recovery.core.Entities;
using System.Text.RegularExpressions;

namespace recovery.core.Helpers
{
    public static class MarkdownHelper
    {
        #region Markdown 组件正则匹配表达式
        /// <summary>
        /// 图片组件
        /// </summary>
        private const string IMAGE_REGEX_PATTERN = "!(\\[)\\w*(\\])(\\()(http|https)://([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?(\\))";
        #endregion

        #region Markdown 组件正则匹配实例
        /// <summary>
        /// 图片组件
        /// </summary>
        private static Regex? _imageRegex = null;
        public static Regex ImageRegex
        {
            get
            {
                return _imageRegex ??= new Regex(IMAGE_REGEX_PATTERN);
            }
        }
        #endregion


        /// <summary>
        /// 解析图片组件
        /// </summary>
        /// <param name="content">待解析的内容</param>
        /// <param name="checkRegex">是否检查正则匹配（默认不检查）</param>
        /// <returns></returns>
        public static ImageComponent? ParseImageComponent(string content, bool checkRegex = false)
        {
            if(checkRegex && (!ImageRegex.Match(content).Success))
            {
                return null;
            }

            // imageMatchObject.Value 示例：![abc](https://hello/a.png)
            // 分割后结果如下：!、abc、''、https://hello/a.png、''
            var imageComponentSlices = content.Split(new char[] { '[', ']', '(', ')' });
            if (imageComponentSlices.Length is 5)
            {
                return new ImageComponent()
                {
                    Name = imageComponentSlices[1],
                    Url = imageComponentSlices[3],
                };
            }

            return null;
        }


        /// <summary>
        /// 解析图片组件
        /// </summary>
        /// <param name="content">待解析的内容</param>
        /// <param name="removeDuplicates">去除重复图片</param>
        /// <returns></returns>
        public static IEnumerable<ImageComponent> ParseImageComponents(string content)
        {
            var imageComponents = new List<ImageComponent>();
            var imageMatchObjects = ImageRegex.Matches(content);
            if (imageMatchObjects.Any())
            {
                foreach(var imageMatchObject in imageMatchObjects)
                {
                    imageComponents.Add(ParseImageComponent(((Match)imageMatchObject).Value) ?? throw new Exception($"文本 {((Match)imageMatchObject).Value} 解析图片组件失败"));
                }
            }
            return imageComponents;
        }
    }
}
