using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class UpdateHelper
    {
        /// <summary>
        /// 获取当前版本号
        /// </summary>
        /// <returns></returns>
        public static string GetLocalVersion()
        {
            var assembly = Assembly.GetEntryAssembly();
            if (assembly != null)
            {
                return $"v{assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>().InformationalVersion}";
            }
            return string.Empty;
        }


        /// <summary>
        /// 获取最新版本号
        /// </summary>
        /// <param name="checkUrl">数据源</param>
        /// <returns>获取成功返回最新版本号, 否则返回空字符串</returns>
        public static async Task<string> GetLatestVersion(string checkUrl)
        {
            var tagsRequest = new HttpClient();
            tagsRequest.DefaultRequestHeaders.Add("User-Agent", "PostmanRuntime/7.29.0");
            tagsRequest.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");

            List<GithubTag>? tags = await tagsRequest.GetFromJsonAsync<List<GithubTag>>(checkUrl);
            if ((tags != null) && (tags.Any()))
            {
                return tags.First().name;
            }
            else
            {
                return string.Empty;
            }
        }
    }


    public class GithubTag
    {
        public string name { get; set; }
        public string zipball_url { get; set; }
        public string tarball_url { get; set; }
        public Commit commit { get; set; }
        public string node_id { get; set; }
    }


    public class Commit
    {
        public string sha { get; set; }
        public string url { get; set; }
    }
}