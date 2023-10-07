using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model.Entity
{
    public class MarkEntity
    {
        public int Total { get; set; }                      // 图片总数
        public List<Image>? Images { get; set; }            // 图片集和
    }


    public class Image
    {
        public string Space { get; set; } = "Local";    // 图片备份空间
        public string Path { get; set; } = "";          // 备份路径
        public string Url { get; set; } = "";           // Url
        public long Time { get; set; }                  // 备份时间
    }
}
