using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model.Entity
{
    public class FileEntity : NotifyBase
    {
        private string _filename = "";
        public string FileName
        {
            get { return _filename; }
            set
            {
                _filename = value;
                DoNotify();
            }
        }

        private string _size = "";
        public string Size
        {
            get { return _size; }
            set
            {
                _size = value;
                DoNotify();
            }
        }

        private string _icon = "";
        public string Icon
        {
            get { return _icon; }
            set
            {
                _icon = value;
                DoNotify();
            }
        }

        private string _fullpath = "";
        public string FullPath
        {
            get { return _fullpath; }
            set
            {
                _fullpath = value;
                DoNotify();
            }
        }
    }
}
