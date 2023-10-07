using recovery.Common;
using recovery.ViewModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace recovery.View
{
    /// <summary>
    /// FileListView.xaml 的交互逻辑
    /// </summary>
    public partial class FileListView : UserControl
    {
        public FileListView()
        {
            InitializeComponent();

            GlobalValues.FileListView = this;
            GlobalValues.FileListViewModel = new FileListViewModel();
            GlobalValues.FileListModel = GlobalValues.FileListViewModel.FileListModel;

            DataContext = GlobalValues.FileListViewModel;
        }
    }
}
