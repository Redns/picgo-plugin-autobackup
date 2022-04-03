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

        private AppSetting _settings;
        public AppSetting Settings
        {
            get { return _settings; }
            set
            {
                _settings = value;
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

        public SettingModel()
        {
            Settings = AppSetting.Get("appsettings.json") ?? new AppSetting();
        }
    }
}
