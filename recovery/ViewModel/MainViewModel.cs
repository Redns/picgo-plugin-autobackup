using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.WindowsAPICodePack.Dialogs;
using System.Windows;
using recovery.View;
using recovery.Model.Entity;
using System.IO;
using HandyControl.Controls;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using recovery.Common.UploadHelper;

namespace recovery.ViewModel
{
    public class MainViewModel : NotifyBase
    {
        public MainModel MainModel { get; set; }
        public CommandBase OpenHomeNavCommand { get; set; }
        public CommandBase ChooseSrcFileCommand { get; set; }
        public CommandBase ReUploadImageCommand { get; set; }
        public CommandBase OpenSettingNavCommand { get; set; }
        public CommandBase OpenAboutNavCommand { get; set; }

        public MainViewModel()
        {
            MainModel = new MainModel();

            OpenHomeNavCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = new Action<object>((o) =>
                {
                    if(GlobalValues.FileListView != null)
                    {
                        MainModel.MainContent = GlobalValues.FileListView;
                    }
                    else
                    {
                        MainModel.MainContent = new FileListView();
                    }
                })
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
                DoExecute = new Action<object>((o) => MainModel.MainContent = new SettingView())
            };

            OpenAboutNavCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((s) => true),
                DoExecute = new Action<object>((o) => MainModel.MainContent = new AboutView())
            };
        }


        /// <summary>
        /// 选择源文件
        /// </summary>
        /// <param name="o"></param>
        public void ChooseSrcFile(object o)
        {
            if (MainModel.Uploading)
            {
                Growl.Info("正在上传中, 无法添加文件!");
            }
            else
            {
                var openFileDialog = new Microsoft.Win32.OpenFileDialog()
                {
                    Title = "请选择源文件",
                    Filter = "源文件 | *.md;*.html;*.js;*.json;*.xlsx;*.doc;*.docx;*.txt",
                    Multiselect = true
                };
                if (openFileDialog.ShowDialog() ?? false)
                {
                    openFileDialog.FileNames.ToList().ForEach(filepath =>
                    {
                        var fileinfo = new FileInfo(filepath);
                        var fileExt = UnitNameGenerator.GetFileExtension(fileinfo.Name) ?? "";
                        GlobalValues.FileListModel.Files.Add(new FileEntity()
                        {
                            FileName = fileinfo.Name,
                            Size = UnitNameGenerator.RebuildFileSize(fileinfo.Length),
                            Icon = UnitNameGenerator.GetFileIcon(fileExt),
                            FullPath = filepath
                        });
                    });
                }
            }
        }


        /// <summary>
        /// 重新上传图片
        /// </summary>
        /// <param name="o"></param>
        public async void ReUploadImage(object o)
        {
            if (MainModel.Uploading)
            {
                Growl.Info("正在上传中, 请勿重复操作!");
            }
            else if ((GlobalValues.FileListModel.Files == null) || (!GlobalValues.FileListModel.Files.Any()))
            {
                Growl.Error("当前列表中无文件!");
            }
            else
            {
                MainModel.Uploading = true;

                Growl.Info("开始上传!");
                GlobalValues.FileListModel.RunningPercent = 0;

                AppSetting? config = JsonConvert.DeserializeObject<AppSetting>(File.ReadAllText("appsettings.json"));
                MarkEntity? mark = JsonConvert.DeserializeObject<MarkEntity>(File.ReadAllText(config.Commons.MarkfilePath));
                List<Image> reuploadImages = new();
                List<string> reuploadImagePaths = new();
                List<string> reuploadImageUrls = new();

                // 将文件对象拷贝至数组 files, 避免无法递归
                FileEntity[] files = new FileEntity[GlobalValues.FileListModel.Files.Count];
                GlobalValues.FileListModel.Files.CopyTo(files, 0);

                // 检索所有文件包含的图片
                foreach(var file in files)
                {
                    var content = File.ReadAllText(file.FullPath);
                    foreach(var image in mark.Images)
                    {
                        if (content.Contains(image.Url))
                        {
                            mark.Total--;
                            mark.Images.Remove(image);
                            reuploadImages.Add(image);
                        }
                    }
                }
                File.WriteAllText(config.Commons.MarkfilePath, JsonConvert.SerializeObject(mark));

                // 拷贝图片至 Temp 文件夹
                if (Directory.Exists("Temp")) { Directory.Delete("Temp"); }
                Directory.CreateDirectory("Temp");

                var localUploadHelper = new LocalUploadHelper();
                var nutStoreUploadHelper = new NutStoreUploadHelper();
                foreach(var image in reuploadImages)
                {
                    reuploadImagePaths.Add(image.Url);
                    if(image.Space == "Local")
                    {
                        using(var imageReader = localUploadHelper.GetImage(image.Path))
                        {
                            using(var imageWriter = new FileStream("Temp", FileMode.Create))
                            {
                                await imageReader.CopyToAsync(imageWriter);
                                await imageWriter.FlushAsync();
                            }
                        }
                        localUploadHelper.DelImage(image.Path);
                    }
                    else if(image.Space == "NutStore")
                    {
                        using(var imageReader = nutStoreUploadHelper.GetImage(image.Path))
                        {
                            using(var imageWriter = new FileStream("Temp", FileMode.Create))
                            {
                                await imageReader.CopyToAsync(imageWriter);
                                await imageWriter.FlushAsync();
                            }
                        }
                        nutStoreUploadHelper.DelImage(image.Path);
                    }
                }

                // 重新上传图片
                var uploadRes = await PicgoHelper.UploadImage(config.Commons.PicgoUploadUrl, reuploadImagePaths);
                if(uploadRes.result != null)
                {
                    foreach(var url in uploadRes.result)
                    {
                        reuploadImageUrls.Add(url);
                    }
                }

                // 替换文章中的

                MainModel.Uploading = false;
            }
        }
    }
}
