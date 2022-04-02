using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.WindowsAPICodePack.Dialogs;

namespace recovery.ViewModel
{
    public class MainViewModel : NotifyBase
    {
        public MainModel mainModel { get; set; }
        public CommandBase ChooseMarkfileCommand { get; set; }
        public CommandBase ChooseOutputDirCommand { get; set; }

        public MainViewModel()
        {
            mainModel = new MainModel();
            ChooseMarkfileCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseMarkfile
            };
            ChooseOutputDirCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseOutputDir
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
                mainModel.MarkfilePath =  openFileDialog.FileName;
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
                mainModel.OutputDir = dlg.FileName;
            }
        }
    }
}
