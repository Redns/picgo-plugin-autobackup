﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recovery.Common
{
    public class UnitNameGenerator
    {
        public const double FILESIZE_1KB = 1024.0;
        public const double FILESIZE_1MB = 1024 * 1024.0;
        public const double FILESIZE_1GB = 1024 * 1024 * 1024.0;


        /// <summary>
        /// 获取时间戳
        /// </summary>
        /// <returns></returns>
        public static long GetTimeStamp()
        {
            return (long)(DateTime.Now.Subtract(new DateTime(1970, 1, 1)).TotalMilliseconds);
        }


        /// <summary>
        /// 判断命名是否符合规范
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        public static bool IsLegalName(string name)
        {
            if (string.IsNullOrEmpty(name) || (name.Length > 255) || (name[0] == ' ') ||
               name.Contains('?') || name.Contains('/') || name.Contains('\\') ||
               name.Contains('<') || name.Contains('>') || name.Contains('*') ||
               name.Contains('|') || name.Contains(':'))
            {
                return false;
            }
            return true;
        }


        /// <summary>
        /// 获取文件图标
        /// </summary>
        /// <param name="ext"></param>
        /// <returns></returns>
        public static string GetFileIcon(string ext)
        {
            return ext.ToLower() switch
            {
                "html" => "/Assets/Images/html.png",
                "doc" => "/Assets/Images/word.png",
                "docx" => "/Assets/Images/word.png",
                "md" => "/Assets/Images/markdown.png",
                "xlsx" => "/Assets/Images/excel.png",
                _ => "/Assets/Images/file.png"
            };
        }


        /// <summary>
        /// 获取文件图标颜色
        /// </summary>
        /// <param name="ext"></param>
        /// <returns></returns>
        public static string GetFileIconColor(string ext)
        {
            return ext.ToLower() switch
            {
                "html" => "#FF7CCDFF",
                "doc" => "#FF5090F1",
                "docx" => "#FF5090F1",
                "md" => "#FF42A5F5",
                "xlsx" => "#FF00C296",
                _ => "#FF2AB2BE"
            };
        }


        /// <summary>
        /// 获取文件拓展名
        /// </summary>
        /// <param name="filename"></param>
        /// <returns></returns>
        public static string? GetFileExtension(string filename)
        {
            return filename.Split('.').Last();
        }


        /// <summary>
        /// 文件类型
        /// </summary>
        public enum FileType
        {
            IMAGE = 0,          // 图片
            COMPRESS,           // 压缩文件
            BIN,                // 二进制
            ILLEGAL             // 非法
        }


        /// <summary>
        /// 根据文件名后缀获取文件类型
        /// </summary>
        /// <param name="extension">文件后缀</param>
        /// <returns></returns>
        public static FileType GetFileType(string extension)
        {
            if (string.IsNullOrEmpty(extension))
            {
                return FileType.ILLEGAL;
            }
            else
            {
                extension = extension.ToLower();
                if (extension.Contains("jpg") ||
                    extension.Contains("png") ||
                    extension.Contains("jpeg") ||
                    extension.Contains("svg") ||
                    extension.Contains("bmp") ||
                    extension.Contains("gif") ||
                    extension.Contains("tiff") ||
                    extension.Contains("raw"))
                {
                    return FileType.IMAGE;
                }
                else if (extension.Contains("zip") ||
                        extension.Contains("rar") ||
                        extension.Contains("7z"))
                {
                    return FileType.COMPRESS;
                }
                else
                {
                    return FileType.BIN;
                }
            }
        }


        /// <summary>
        /// 格式化文件大小
        /// </summary>
        /// <param name="len">文件大小(单位:Byte)</param>
        /// <returns></returns>
        public static string RebuildFileSize(long len)
        {
            if (len < FILESIZE_1KB)
            {
                return $"{len}B";
            }
            else if (len < 1 * FILESIZE_1MB)
            {
                return $"{len / FILESIZE_1KB: #.##}KB";
            }
            else if (len < FILESIZE_1GB)
            {
                return $"{len / FILESIZE_1MB:#.##}MB";
            }
            else
            {
                return string.Empty;
            }
        }


        /// <summary>
        /// 解析文件大小字符串(B、KB、MB)
        /// </summary>
        /// <param name="size">格式化后的文件大小</param>
        /// <returns>文件大小(以KB计)</returns>
        public static double ParseFileSize(string size)
        {
            if (size.Contains("MB"))
            {
                return double.Parse(size[0..^2]) * 1024;
            }
            else if (size.Contains("KB"))
            {
                return double.Parse(size[0..^2]);
            }
            else
            {
                return double.Parse(size[0..^2]) / 1024.0;
            }
        }


        /// <summary>
        /// 生成随机字符串
        /// </summary>
        /// <param name="len">字符串长度</param>
        /// <returns></returns>
        public static string GererateRandomString(int len)
        {
            string str = string.Empty;
            long num2 = DateTime.Now.Ticks;
            Random random = new(((int)(((ulong)num2) & 0xffffffffL)) | ((int)(num2 >> len)));
            for (int i = 0; i < len; i++)
            {
                char ch;
                int num = random.Next();
                if ((num % 2) == 0)
                {
                    ch = (char)(0x30 + ((ushort)(num % 10)));
                }
                else
                {
                    ch = (char)(0x41 + ((ushort)(num % 0x1a)));
                }
                str += ch.ToString();
            }
            return str;
        }


        /// <summary>
        /// 重命名格式
        /// </summary>
        public enum RenameFormat
        {
            NONE = 0,               // 不重命名
            MD5,                    // MD5重命名
            TIME,                   // 时间重命名
            TIMESTAMP,              // 时间戳重命名
            RANDOM_STRING           // 随机字符串重命名
        }


        /// <summary>
        /// 重命名文件
        /// </summary>
        /// <param name="dir">文件夹</param>
        /// <param name="srcName">源文件名称</param>
        /// <param name="format">重命名规则</param>
        /// <returns></returns>
        public static string RenameFile(string dir, string srcName, RenameFormat format)
        {
            Directory.CreateDirectory(dir);

            if (format == RenameFormat.NONE) { return srcName; }
            string dstName = format switch
            {
                RenameFormat.MD5 => EncryptAndDecrypt.Encrypt_MD5(srcName),
                RenameFormat.TIME => DateTime.Now.ToLocalTime()
                                                 .ToString()
                                                 .Replace(":", "-")
                                                 .Replace("/", "-"),
                RenameFormat.TIMESTAMP => GetTimeStamp().ToString(),
                RenameFormat.RANDOM_STRING => GererateRandomString(8),
                _ => srcName,
            };
            dstName += $".{GetFileExtension(srcName)}";

            if ((format != RenameFormat.NONE) && File.Exists(dstName))
            {
                dstName = RenameFile(dir, dstName, format);
                return dstName;
            }
            else
            {
                return dstName;
            }
        }


        /// <summary>
        /// 链接格式
        /// </summary>
        public enum UrlFormat
        {
            Markdown = 0,
            Html,
            Url,
            UBB
        }


        /// <summary>
        /// 按指定形式构造图片URL
        /// </summary>
        /// <param name="format"></param>
        /// <param name="url"></param>
        /// <returns></returns>
        public static string UrlBuild(UrlFormat format, string url)
        {
            return format switch
            {
                UrlFormat.Markdown => $"![{url.Split("/").Last()}]({url})",
                UrlFormat.Html => $"<img src=\"{url}\">",
                UrlFormat.UBB => $"[img]{url}[/img]",
                _ => url
            };
        }
    }
}
