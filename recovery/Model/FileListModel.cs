using recovery.Common;
using recovery.Model.Entity;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model
{
    public class FileListModel : NotifyBase
    {
        private ObservableCollection<FileEntity>? files;
        public ObservableCollection<FileEntity>? Files
        {
            get { return files; }
            set 
            { 
                files = value; 
                DoNotify();
            }
        }


        private bool _running;
        public bool Running
        {
            get { return _running; }
            set
            {
                _running = value;
                DoNotify();
            }
        }

        private string _runningMsg = string.Empty;
        public string RunningMsg
        {
            get { return _runningMsg; }
            set
            {
                _runningMsg = value;
                DoNotify();
            }
        }

        private int _runningPercent;
        public int RunningPercent
        {
            get { return _runningPercent; }
            set
            {
                _runningPercent = value;
                DoNotify();
            }
        }
    }
}
