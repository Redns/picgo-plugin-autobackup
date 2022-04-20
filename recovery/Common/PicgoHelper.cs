using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    // TODO 使用 HttpClient() 重写
    public class PicgoHelper
    {
        /// <summary>
        /// 上传图片至Picgo
        /// </summary>
        /// <param name="url">Picgo端口</param>
        /// <param name="paths">本地图片路径数组</param>
        /// <returns></returns>
        public static async Task<PicgoUploadResponse?> UploadImage(string url, List<string> paths)
        {
            // 填充参数
            HttpContent content = new StringContent(JsonConvert.SerializeObject(new PicgoUploadRequest(paths)));
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            // 发送请求
            var resp = await new HttpClient().PostAsync(url, content);
            return JsonConvert.DeserializeObject<PicgoUploadResponse?>(await resp.Content.ReadAsStringAsync());
        }
    }


    /// <summary>
    /// 上传请求
    /// </summary>
    public class PicgoUploadRequest
    {
        public string[]? list;
        public PicgoUploadRequest(List<string> paths)
        {
            list = paths.ToArray();
        }
    }


    /// <summary>
    /// 上传结果
    /// </summary>
    public class PicgoUploadResponse
    {
        public bool success;
        public string[]? result;
    }
}
