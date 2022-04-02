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
        private string _id = string.Empty;
        public string Id
        {
            get { return _id; }
            set
            {
                _id = value;
                DoNotify();
            }
        }

        private string _filename = string.Empty;
        public string Filename
        {
            get { return _filename; }
            set
            {
                _filename = value;
                DoNotify();
            }
        }

        private string _extname = string.Empty;
        public string Extname
        {
            get { return _extname; }
            set
            {
                _extname = value;
                DoNotify();
            }
        }

        private string _size = string.Empty;
        public string Size
        {
            get { return _size; }
            set
            {
                _size = value;
                DoNotify();
            }
        }

        private string _dir = string.Empty;
        public string Dir
        {
            get { return _dir; }
            set
            {
                _dir = value;
                DoNotify();
            }
        }
    }
}
