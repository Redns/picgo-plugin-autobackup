using HandyControl.Controls;
using Microsoft.WindowsAPICodePack.Dialogs;
using Newtonsoft.Json;
using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace recovery.ViewModel
{
    public class SettingViewModel
    {
        public SettingModel settingModel { get; set; }
        public CommandBase ChooseMarkfileCommand { get; set; }
        public CommandBase ChooseImageDirCommand { get; set; }
        public CommandBase ChooseOutputDirCommand { get; set; }
        public CommandBase CheckPicgoUrlCommand { get; set; }
        public CommandBase ImportConfigCommand { get; set; }
        public CommandBase ExportConfigCommand { get; set; }
        public CommandBase SaveConfigCommand { get; set; }

        public SettingViewModel()
        {
            settingModel = new SettingModel();

            ChooseMarkfileCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseMarkfile
            };

            ChooseImageDirCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseImageDir
            };

            ChooseOutputDirCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseOutputDir
            };

            CheckPicgoUrlCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = CheckPicgoUrl
            };

            ImportConfigCommand = new CommandBase()
            {
                DoCanExecute= new Func<object, bool>((o) => true),
                DoExecute= ImportConfig
            };

            ExportConfigCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ExportConfig
            };

            SaveConfigCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = SaveConfig
            };
        }


        /// <summary>
        /// 选择 MARK 文件
        /// </summary>
        /// <param name="o"></param>
        public void ChooseMarkfile(object o)
        {
            var openFileDialog = new Microsoft.Win32.OpenFileDialog() 
            {
                Title = "请选择 Mark 文件",
                Filter = "Mark文件|*.json"
            };
            if (openFileDialog.ShowDialog() ?? false)
            {
                settingModel.Settings.Commons.MarkfilePath =  openFileDialog.FileName;
            }
        }


        /// <summary>
        /// 选择文件输出路径
        /// </summary>
        /// <param name="o"></param>
        public void ChooseImageDir(object o)
        {
            var dlg = new CommonOpenFileDialog
            {
                Title = "图片备份路径",
                IsFolderPicker = true
            };

            if (dlg.ShowDialog() == CommonFileDialogResult.Ok)
            {
                settingModel.Settings.Spaces.Local.ImageDir = dlg.FileName;
            }
        }


        /// <summary>
        /// 选择文件输出路径
        /// </summary>
        /// <param name="o"></param>
        public void ChooseOutputDir(object o)
        {
            var dlg = new CommonOpenFileDialog
            {
                Title = "文件输出路径",
                IsFolderPicker = true
            };

            if (dlg.ShowDialog() == CommonFileDialogResult.Ok)
            {
                settingModel.Settings.Commons.FileOutputDir = dlg.FileName;
            }
        }


        /// <summary>
        /// 检查Picgo Url是否可访问
        /// </summary>
        /// <param name="o"></param>
        public async void CheckPicgoUrl(object o)
        {
            settingModel.PicgoUrlTestButtonContent = "";
            settingModel.PicgoUrlTestRunning = System.Windows.Visibility.Visible;

            try
            {
                var resp = await PicgoHelper.UploadImage(settingModel.Settings?.Commons?.PicgoUploadUrl ?? "http://127.0.0.1:36677/upload", new List<string>() { "Assets/Images/Icon.png" });
                if(resp != null) { Growl.Success("链接 PicGo 成功!"); }
                else { Growl.Error("链接 PicGo 失败!"); }
            }
            catch
            {
                Growl.Error("链接 PicGo 失败!"); 
            }
            finally
            {
                settingModel.PicgoUrlTestButtonContent = "测 试";
                settingModel.PicgoUrlTestRunning = System.Windows.Visibility.Hidden;
            }
        }


        /// <summary>
        /// 保存设置
        /// </summary>
        /// <param name="o"></param>
        public void SaveConfig(object o)
        {
            try
            {
                File.WriteAllText("appsettings.json", JsonConvert.SerializeObject(settingModel.Settings));
                Growl.Success("保存设置成功!");
            }
            catch
            {
                Growl.Error("保存设置失败!");
            }
        }

        
        /// <summary>
        /// 导入设置
        /// </summary>
        /// <param name="o"></param>
        public void ImportConfig(object o)
        {
            var openFileDialog = new Microsoft.Win32.OpenFileDialog()
            {
                Title = "待导入的设置文件",
                Filter = "设置文件|*.json"
            };
            if (openFileDialog.ShowDialog() ?? false)
            {
                try
                {
                    var config = JsonConvert.DeserializeObject<AppSetting>(File.ReadAllText(openFileDialog.FileName));
                    if(config?.Commons != null)
                    {
                        settingModel.Settings = config;
                        File.WriteAllText("appsettings.json", JsonConvert.SerializeObject(settingModel.Settings));
                        Growl.Success("设置文件导入成功!");
                    }
                    else
                    {
                        Growl.Error("设置文件导入失败, 请检查文件格式是否正确!");
                    }
                }
                catch
                {
                    Growl.Error("设置文件导入失败!");
                }
            }
        }


        /// <summary>
        /// 导出设置
        /// </summary>
        /// <param name="o"></param>
        public void ExportConfig(object o)
        {
            var dlg = new CommonOpenFileDialog
            {
                Title = "设置文件导出路径",
                IsFolderPicker = true
            };

            if (dlg.ShowDialog() == CommonFileDialogResult.Ok)
            {
                try
                {
                    File.WriteAllText($"{dlg.FileName}/appsettings.json", JsonConvert.SerializeObject(settingModel.Settings));
                    Growl.Success("设置文件导出成功!");
                }
                catch
                {
                    Growl.Error("设置文件导出失败!");
                }
            }
        }
    }
}
