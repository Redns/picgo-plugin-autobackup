# picgo-plugin-autobackup

![version: v1.3.7 (shields.io)](https://img.shields.io/badge/version-v1.3.7-green)

<br>

## 简介

将图片存储在免费的`公共图床`是非常吸引人的，尤其是那些带有`cdn`加速的图床。然而，这些图床的稳定性总让我们担忧，如何既能让我们享受公共图床带来的便利，又能解决后顾之忧？也许将图片备份下来是个不错的选择！当公共图床失效时，我们可以重新上传这些图片，而不必担心永远失去它们，本插件就是一款专注于图片备份的插件。

<br>

## 插件特点

- 支持自定义备份位置 (目前仅支持本地备份 )
- 支持自定义备份文件夹

<br>

## 环境搭建

1. `GUI` 用户直接在 `插件设置` 中搜索`autobackup`下载安装

   ![image-20220215222022205](https://img1.imgtp.com/2022/02/15/kApL4Y22.png)

<br>

2. 点击 `autobackup` 右下角的 `齿轮按钮`，选择 `配置Plugin`

   ![image-20220330213614892](https://imgtp.apqiang.com/2022/03/30/MvYDqfK0.png)

   <br>

3. 根据实际情况配置

   ![image-20220330213725702](http://jing-image.test.upcdn.net/image-20220330213725702.png)

   - `备份空间`：用以区分备份的位置 (本地、云盘、……)，目前仅支持本地 (local)
   - `mark文件路径`：用于存储备份图片的相关信息以便后期恢复、重传，默认路径为 `{picgo安装目录}/mark.json`
   - `备份路径`：图片备份路径，默认存储路径为 `{picgo安装目录}/Images`

   <br>

4. 点击 `确定`，设置完成！



