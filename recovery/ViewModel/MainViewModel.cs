﻿using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.WindowsAPICodePack.Dialogs;
using System.Windows;
using recovery.View;

namespace recovery.ViewModel
{
    public class MainViewModel : NotifyBase
    {
        public MainModel mainModel { get; set; }
        public CommandBase OpenHomeNavCommand { get; set; }
        public CommandBase ChooseSrcFileCommand { get; set; }
        public CommandBase ReUploadImageCommand { get; set; }
        public CommandBase OpenSettingNavCommand { get; set; }

        public MainViewModel()
        {
            mainModel = new MainModel();

            OpenHomeNavCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = new Action<object>((o) => mainModel.MainContent = new FileListView())
            };

            ChooseSrcFileCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ChooseSrcFile
            };

            ReUploadImageCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = ReUploadImage
            };

            OpenSettingNavCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = new Action<object>((o) => mainModel.MainContent = new SettingView())
            };

            mainModel.MainContent = new SettingView();
        }


        /// <summary>
        /// 选择源文件
        /// </summary>
        /// <param name="o"></param>
        public void ChooseSrcFile(object o)
        {
            var openFileDialog = new Microsoft.Win32.OpenFileDialog()
            {
                Title = "请选择源文件",
                Filter = "所有文件|*.*",
                Multiselect = true
            };
            if (openFileDialog.ShowDialog() ?? false)
            {
                mainModel.SrcFilePath = openFileDialog.FileNames.ToList();
            }
        }


        /// <summary>
        /// 重新上传图片
        /// </summary>
        /// <param name="o"></param>
        public void ReUploadImage(object o)
        {

        }
    }
}