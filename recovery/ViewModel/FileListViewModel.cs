using recovery.Common;
using recovery.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.ViewModel
{
    public class FileListViewModel
    {
        public FileListModel FileListModel { get; set; }
        public CommandBase RemoveFileCommand { get; set; }

        public FileListViewModel()
        {
            FileListModel = new()
            {
                Files = new(),
                Running = false,
                RunningMsg = "",
                RunningPercent = 0
            };

            RemoveFileCommand = new CommandBase()
            {
                DoCanExecute = new Func<object, bool>((o) => true),
                DoExecute = new Action<object>((o) => FileListModel.Files.Remove(FileListModel.Files.First(f => f.FileName == o.ToString())))
            };
        }
    }
}
