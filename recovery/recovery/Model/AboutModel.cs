using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model
{
    public class AboutModel : NotifyBase
    {
        private string _versionNow;
        public string VersionNow
        {
            get { return _versionNow; }
            set
            {
                _versionNow = value;
                DoNotify();
            }
        }

        private string _checkUrl;
        public string CheckUrl
        {
            get { return _checkUrl; }
            set
            {
                _checkUrl = value;
                DoNotify();
            }
        }

        private string _downloadUrl;
        public string DownloadUrl
        {
            get { return _downloadUrl; }
            set
            {
                _downloadUrl = value;
                DoNotify();
            }
        }
    }
}
