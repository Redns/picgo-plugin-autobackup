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

        public FileListViewModel()
        {
            FileListModel = new()
            {
                Files = new(),
                Running = false,
                RunningMsg = "",
                RunningPercent = 0
            };
        }
    }
}
