using recovery.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace recovery.Model
{
    public class MainModel : NotifyBase
    {
        private FrameworkElement? _mainContent;
        public FrameworkElement? MainContent
        {
            get { return _mainContent; }
            set 
            { 
                _mainContent = value; 
                DoNotify(); 
            }
        }

        private List<string> _srcFilepath;
        public List<string> SrcFilePath
        {
            get { return _srcFilepath; }
            set
            {
                _srcFilepath = value;
                DoNotify();
            }
        }

        public MainModel()
        {
            SrcFilePath = new List<string>();
        }
    }
}
