using recovery.Common;
using recovery.ViewModel;
using System;
using System.Collections.Generic;
using System.Diagnostics;
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
using System.Windows.Shapes;

namespace recovery.View
{
    /// <summary>
    /// MainView.xaml 的交互逻辑
    /// </summary>
    public partial class MainView : Window
    {
        public MainView()
        {
            // 初始化组件
            InitializeComponent();

            // 设置窗口最大高度，避免覆盖任务栏
            MaxHeight = SystemParameters.PrimaryScreenHeight;

            // 设置数据内容
            DataContext = new MainViewModel();
            GlobalValues.MainView = this;
            GlobalValues.MainViewModel = (MainViewModel)DataContext;
            GlobalValues.MainModel = ((MainViewModel)DataContext).MainModel;
        }


        /// <summary>
        /// 拖动上方窗体跟随移动
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void StackPanel_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                if (WindowState == WindowState.Maximized)
                {
                    WindowState = WindowState.Normal;
                }
                DragMove();
            }
        }


        /// <summary>
        /// 最小化窗口
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void WindowMinSize(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }


        /// <summary>
        /// 最大化窗口
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void WindowMaxSize(object sender, RoutedEventArgs e)
        {
            if (WindowState == WindowState.Maximized)
            {
                WindowState = WindowState.Normal;
            }
            else
            {
                WindowState = WindowState.Maximized;
            }
        }


        /// <summary>
        /// 关闭窗口
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void WindowClose(object sender, RoutedEventArgs e)
        {
            Close();
        }


        /// <summary>
        /// 关闭窗口，同时关闭应用程序
        /// </summary>
        /// <param name="e"></param>
        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);
            App.Current.Shutdown();
        }


        /// <summary>
        /// 跳转到项目Github主页
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void GoToGithub(object sender, RoutedEventArgs e)
        {
            //Process.Start("https://github.com/Redns/picgo-plugin-autobackup");
            Process.Start(new ProcessStartInfo("cmd", $"/c start microsoft-edge:https://github.com/Redns/picgo-plugin-autobackup") { CreateNoWindow = true });
        }
    }
}
