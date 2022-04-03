using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model
{
    public class FileListModel : NotifyBase
    {
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
