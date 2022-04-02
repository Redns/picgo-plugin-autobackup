using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Model
{
    public class MainModel : NotifyBase
    {
        private string _markfilePath = string.Empty;
        public string MarkfilePath
        {
            get { return _markfilePath; }
            set
            {
                _markfilePath = value;
                DoNotify();
            }
        }

        private string _outputDir = string.Empty;
        public string OutputDir
        {
            get { return _outputDir; }
            set
            {
                _outputDir = value;
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
