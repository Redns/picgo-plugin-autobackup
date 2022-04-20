using recovery.Model;
using recovery.Model.Entity;
using recovery.View;
using recovery.ViewModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class GlobalValues
    {
        public static MainView? MainView { get; set; }
        public static MainViewModel? MainViewModel { get; set; }
        public static MainModel? MainModel { get; set; }

        public static FileListView? FileListView { get; set; }
        public static FileListViewModel? FileListViewModel { get; set; }
        public static FileListModel? FileListModel { get; set; }
    }
}
