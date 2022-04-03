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
        public FileListModel fileListModel { get; set; }

        public FileListViewModel()
        {
            fileListModel = new FileListModel();
        }
    }
}
