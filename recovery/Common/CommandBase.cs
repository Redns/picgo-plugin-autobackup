using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace recovery.Common
{
    public class CommandBase : ICommand
    {
        // 事件
        public event EventHandler? CanExecuteChanged;

        // 判断是否可执行
        public bool CanExecute(object? parameter)
        {
            if(parameter != null)
            {
                return DoCanExecute?.Invoke(parameter) == true;
            }
            return true;
        }

        // 执行体
        public void Execute(object? parameter)
        {
            DoExecute?.Invoke(parameter ?? new object());
        }

        public Action<object>? DoExecute { get; set; }
        public Func<object, bool>? DoCanExecute { get; set; }
    }
}
