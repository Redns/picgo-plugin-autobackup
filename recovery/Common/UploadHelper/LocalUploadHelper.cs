using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common.UploadHelper
{
    public class LocalUploadHelper : IUploadHelper
    {
        /// <summary>
        /// 删除图片
        /// </summary>
        /// <param name="o">图片路径</param>
        /// <returns></returns>
        public bool DelImage(object o)
        {
            var path = o.ToString();
            if (!string.IsNullOrEmpty(path))
            {
                try
                {
                    if (File.Exists(path))
                    {
                        File.Delete(path);
                    }
                    return true;
                }
                catch { }
            }
            return false;
        }


        /// <summary>
        /// 获取图片
        /// </summary>
        /// <param name="path">图片路径</param>
        /// <returns>图片数据流, 获取失败返回Stream.Null</returns>
        public Stream GetImage(object o)
        {
            var path = o.ToString();
            if (!string.IsNullOrEmpty(path))
            {
                try
                {
                    if (File.Exists(path))
                    {
                        return File.OpenRead(path);
                    }
                }
                catch { }
            }
            return Stream.Null;
        }
    }
}
