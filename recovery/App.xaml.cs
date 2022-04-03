using recovery.Common;
using recovery.View;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace recovery
{
    /// <summary>
    /// App.xaml 的交互逻辑
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
        }

        private void Application_Startup(object sender, StartupEventArgs e)
        {
            var res = PicgoHelper.UploadImage("http://127.0.0.1:36677/upload", new List<string>() { "D:\\OneDrive\\图片\\Logo\\1.jpeg" });
            new MainView().Show();
        }
    }
}
