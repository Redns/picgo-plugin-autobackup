using Microsoft.WindowsAPICodePack.Dialogs;
using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Linq;
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
        public CommandBase CheckUpdateCommand { get; set; }

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

            CheckUpdateCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = CheckUpdate
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
        public void CheckPicgoUrl(object o)
        {
            settingModel.PicgoUrlTestButtonContent = "";
            settingModel.PicgoUrlTestRunning = System.Windows.Visibility.Visible;
        }


        /// <summary>
        /// 检查应用更新
        /// </summary>
        /// <param name="o"></param>
        public void CheckUpdate(object o)
        {

        }
    }
}
