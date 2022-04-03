using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class AppSettings
    {
        /// <summary>
        /// 加载设置文件
        /// </summary>
        /// <param name="path">设置文件路径</param>
        /// <returns></returns>
        public static AppSetting? LoadSettings(string path)
        {
            try
            {
                return JsonConvert.DeserializeObject<AppSetting>(File.ReadAllText(path));
            }
            catch (Exception)
            {
                return null;
            }
        }


        /// <summary>
        /// 修改设置文件
        /// </summary>
        /// <param name="settings">设置文件对象</param>
        /// <param name="path">设置文件路径</param>
        /// <returns>修改成功返回true，否则返回false</returns>
        public static bool SetSettings(AppSetting settings, string path)
        {
            if((settings != null) && (!string.IsNullOrEmpty(path)))
            {
                try
                {
                    File.WriteAllText(path, JsonConvert.SerializeObject(settings));
                }
                catch (Exception)
                {
                    return false;
                }
                return true;
            }
            return false;
        }
    }


    public class AppSetting
    {
        public Path? Paths { get; set; }
        public Url? Urls { get; set; }
    }

    public class Path
    {
        public string MarkfilePath { get; set; } = string.Empty;
        public string ImageBackupDir { get; set; } = string.Empty;
        public string FileOutputDir { get; set; } = string.Empty;
    }

    public class Url
    {
        public string PicgoUploadUrl { get; set; } = string.Empty;
        public string CheckUpdateUrl { get; set; } = string.Empty;
    }
}
