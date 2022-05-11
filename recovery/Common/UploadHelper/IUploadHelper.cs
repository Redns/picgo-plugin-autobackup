using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common.UploadHelper
{
    public interface IUploadHelper
    {
        Stream GetImage(object o);
        bool DelImage(object o);
    }
}
