using HandyControl.Controls;
using Newtonsoft.Json;
using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace recovery.ViewModel
{
    public class AboutViewModel
    {
        public AboutModel AboutModel { get; set; }
        public CommandBase CheckUpdateCommand { get; set; }
        public CommandBase SaveConfigCommand { get; set; }
        public AppSetting? AppSetting { get; set; }

        public AboutViewModel()
        {
            AppSetting = JsonConvert.DeserializeObject<AppSetting>(File.ReadAllText("appsettings.json"));
            AboutModel = new AboutModel()
            {
                VersionNow = UpdateHelper.GetLocalVersion(),
                CheckUrl = AppSetting.Commons.CheckUpdateUrl,
                DownloadUrl = AppSetting.Commons.DownloadUrl
            };

            CheckUpdateCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = CheckUpdate
            };

            SaveConfigCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = SaveConfig
            };
        }


        /// <summary>
        /// 检查更新
        /// </summary>
        /// <param name="o"></param>
        public async void CheckUpdate(object o)
        {
            Growl.Info("正在检查更新...");

            string versionNow = UpdateHelper.GetLocalVersion();
            string versionLatest = await UpdateHelper.GetLatestVersion(AboutModel.CheckUrl);

            if ((!string.IsNullOrEmpty(versionLatest)) && (versionNow.ToLower() != versionLatest.ToLower()))
            {
                var res = HandyControl.Controls.MessageBox.Show($"检测到最新版本 {versionLatest}, 现在更新?", "应用更新", MessageBoxButton.YesNo, MessageBoxImage.Question);
                if(res == MessageBoxResult.Yes)
                {
                    try
                    {
                        var config = JsonConvert.DeserializeObject<AppSetting>(File.ReadAllText("appsettings.json"));
                        using (var downloadStream = await new HttpClient().GetStreamAsync(config.Commons.DownloadUrl))
                        {
                            using (var StreamWriter = new FileStream("Recovery.exe", FileMode.OpenOrCreate))
                            {
                                await downloadStream.CopyToAsync(StreamWriter);
                                await StreamWriter.FlushAsync();
                            }
                            await downloadStream.FlushAsync();
                        }

                        new Process()
                        {
                            StartInfo = new ProcessStartInfo("Recovery.exe")
                        }.Start();
                        Process.GetCurrentProcess().Kill();
                    }
                    catch
                    {

                    }
                }
            }
            else
            {
                Growl.Success("该应用已是最新版!");
            }
        }


        /// <summary>
        /// 保存设置
        /// </summary>
        /// <param name="o"></param>
        public void SaveConfig(object o)
        {
            AppSetting.Commons.CheckUpdateUrl = AboutModel.CheckUrl;
            AppSetting.Commons.DownloadUrl = AboutModel.DownloadUrl;

            try
            {
                File.WriteAllText("appsettings.json", JsonConvert.SerializeObject(AppSetting));
                Growl.Success("保存成功!");
            }
            catch
            {
                Growl.Error("保存失败!");
            }
        }
    }
}
