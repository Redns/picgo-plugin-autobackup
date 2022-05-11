using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class AppSetting : NotifyBase
    {
        private Common? _commmons;
        public Common? Commons
        {
            get { return _commmons; }
            set { _commmons = value; DoNotify(); }
        }

        private Space? _spaces;
        public Space? Spaces
        {
            get { return _spaces; }
            set { _spaces = value; DoNotify(); }
        }

        /// <summary>
        /// 加载设置文件
        /// </summary>
        /// <param name="path">设置文件路径</param>
        /// <returns></returns>
        public static AppSetting? Get(string path)
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
        public static bool Set(AppSetting settings, string path)
        {
            if ((settings != null) && (!string.IsNullOrEmpty(path)))
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

    public class Common : NotifyBase
    {
        private string _markfilePath = string.Empty;
        public string MarkfilePath
        {
            get { return _markfilePath; }
            set { _markfilePath = value;  DoNotify(); }
        }

        private string _fileOutputDir = string.Empty;
        public string FileOutputDir
        {
            get { return _fileOutputDir; }
            set { _fileOutputDir = value; DoNotify(); }
        }

        private string _picgoUploadUrl = string.Empty;
        public string PicgoUploadUrl
        {
            get { return _picgoUploadUrl; }
            set { _picgoUploadUrl = value; DoNotify(); }
        }

        private string _checkUpdateUrl = string.Empty;
        public string CheckUpdateUrl
        {
            get { return _checkUpdateUrl; }
            set { _checkUpdateUrl = value; DoNotify(); }
        }

        private string _downloadUrl = string.Empty;
        public string DownloadUrl
        {
            get { return _downloadUrl; }
            set
            {
                _downloadUrl = value; DoNotify();
            }
        }
    }

    public class Space : NotifyBase
    {
        private Local? _local;
        public Local? Local
        {
            get { return _local; }
            set { _local = value; DoNotify(); }
        }

        private NutStore? _nutStore;
        public NutStore? NutStore
        {
            get { return _nutStore; }
            set { _nutStore = value; DoNotify(); }
        }
    }

    public class Local : NotifyBase
    {
        private string _picGoDir = string.Empty;
        public string PicGoDir
        {
            get { return _picGoDir; }
            set { _picGoDir = value; DoNotify(); }
        }
    }

    public class NutStore : NotifyBase
    {
        private string _username = string.Empty;
        public string Username
        {
            get { return _username; }
            set { _username = value; DoNotify(); }
        }

        private string _password = string.Empty;
        public string Password
        {
            get { return _password; }
            set { _password = value; DoNotify(); }
        }
    }
}
