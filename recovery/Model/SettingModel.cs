using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace recovery.Model
{
    public class SettingModel : NotifyBase
    {
        private string _space = string.Empty;
        public string Space
        {
            get { return _space; }
            set
            {
                _space = value;
                DoNotify();
            }
        }

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

        private string _imageDir = string.Empty;
        public string ImageDir
        {
            get { return _imageDir; }
            set
            {
                _imageDir = value;
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

        private string _picgoUrl = string.Empty;
        public string PicgoUrl
        {
            get { return _picgoUrl; }
            set
            {
                _picgoUrl = value;
                DoNotify();
            }
        }

        private string _picgoUrlTestButtonContent = "测 试";
        public string PicgoUrlTestButtonContent
        {
            get { return _picgoUrlTestButtonContent; }
            set
            {
                _picgoUrlTestButtonContent = value;
                DoNotify();
            }
        }

        private Visibility _picgoUrlTestRunning = Visibility.Hidden;
        public Visibility PicgoUrlTestRunning
        {
            get { return _picgoUrlTestRunning; }
            set
            {
                _picgoUrlTestRunning = value;
                DoNotify();
            }
        }

        private string _checkUpdateUrl = string.Empty;
        public string CheckUpdateUrl
        {
            get { return _checkUpdateUrl; }
            set
            {
                _checkUpdateUrl = value;
                DoNotify();
            }
        }

        private string _checkUpdateButtonContent = "检查更新";
        public string CheckUpdateButtonContent
        {
            get { return _checkUpdateButtonContent; }
            set
            {
                _checkUpdateButtonContent = value;
                DoNotify();
            }
        }

        private Visibility _checkUpdateRunning = Visibility.Hidden;
        public Visibility CheckUpdateRunning
        {
            get { return _checkUpdateRunning; }
            set
            {
                _checkUpdateRunning = value;
                DoNotify();
            }
        }
    }
}
