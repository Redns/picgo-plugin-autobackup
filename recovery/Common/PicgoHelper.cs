using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class PicgoHelper
    {
        /// <summary>
        /// 上传图片至Picgo
        /// </summary>
        /// <param name="url">Picgo端口</param>
        /// <param name="paths">本地图片路径数组</param>
        /// <returns></returns>
        public static PicgoUploadResponse? UploadImage(string url, List<string> paths)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.ContentType = "application/json";
            request.Method = "POST";

            using (var streamWriter = new StreamWriter(request.GetRequestStream()))
            {
                streamWriter.Write(JsonConvert.SerializeObject(new PicgoUploadRequest(paths)));
            }

            try
            {
                var response = (HttpWebResponse)request.GetResponse();
                using var streamReader = new StreamReader(response.GetResponseStream());
                return JsonConvert.DeserializeObject<PicgoUploadResponse>(streamReader.ReadToEnd());
            }
            catch (Exception)
            {
                return null;
            }
        }
    }

    public class PicgoUploadRequest
    {
        public string[]? list;
        public PicgoUploadRequest(List<string> paths)
        {
            list = paths.ToArray();
        }
    }

    public class PicgoUploadResponse
    {
        public bool success;
        public string[]? result;
    }
}
