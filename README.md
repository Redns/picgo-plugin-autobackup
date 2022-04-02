# picgo-plugin-autobackup

![version: v1.4.9 (shields.io)](https://img.shields.io/badge/version-v1.4.9-green)

<br>

## 简介

将图片存储在免费的 `公共图床` 是非常吸引人的，尤其是那些带有`cdn`加速的图床。然而，这些图床的稳定性总让我们担忧，如何既能让我们享受公共图床带来的便利，又能解决后顾之忧？也许将图片备份下来是个不错的选择！当公共图床失效时，我们可以重新上传这些图片，而不必担心永远失去它们，本插件就是一款专注于图片备份的插件。

<br>

## 插件特点

- 支持自定义备份位置 (目前支持本地备份、坚果云备份 )
- 支持自定义备份文件夹
<br>

## 环境搭建

### 安装插件

`GUI` 用户直接在 `插件设置` 中搜索`autobackup`下载安装

![image-20220215222022205](https://img1.imgtp.com/2022/02/15/kApL4Y22.png)

<br>

### 本地备份

1. 进入 `插件设置` 界面

2. 点击 `autobackup` 右下角的 `齿轮按钮`，选择 `配置Plugin`

   ![image-20220330213614892](https://imgtp.apqiang.com/2022/03/30/MvYDqfK0.png)

   <br>

3. 选择 `备份空间` 为 `Local`，填写 `mark文件路径` (默认为 `{picgo安装目录}/Autobackup/mark.json`)

   ![image-20220402154726087](http://jing-image.test.upcdn.net/image-20220402154726087.png)

   <br>

4. 点击 `确定`

5. 再次点击 `autobackup` 右下角的齿轮按钮，选择 `配置本地备份`

   ![image-20220402154935976](http://jing-image.test.upcdn.net/image-20220402154935976.png)

   <br>

6. 在对话框中输入 `图片备份路径` (默认为 `{picgo安装目录}/Autobackup/Images`)，点击确定，设置完成

   <br>

### 坚果云备份

1. 进入 `插件设置` 界面

2. 点击 `autobackup` 右下角的 `齿轮按钮`，选择 `配置Plugin`

   ![image-20220330213614892](https://imgtp.apqiang.com/2022/03/30/MvYDqfK0.png)

   <br>

3. 选择 `备份空间` 为 `NutStore`，填写 `mark文件路径` (默认为 `{picgo安装目录}/Autobackup/mark.json`)，点击 `确定`

   ![image-20220402155516277](http://jing-image.test.upcdn.net/image-20220402155516277.png)

   <br>

4. 再次点击 `autobackup` 右下角的齿轮按钮，选择 `配置坚果云备份`

5. 在对话框中输入 `坚果云用户名`，点击确定

   ![image-20220402155555804](http://jing-image.test.upcdn.net/image-20220402155555804.png)

   <br>

6. 输入坚果云 `应用密码` (注意不是坚果云 `账户密码` ！获取应用密码请跳转至 `Q&A 3` )，点击 `确定`

   ![image-20220402155702454](http://jing-image.test.upcdn.net/image-20220402155702454.png)

   <br>

7. 输入坚果云备份文件夹 (需要提前在坚果云中创建)，点击 `确定`

   ![image-20220402160231352](http://jing-image.test.upcdn.net/image-20220402160231352.png)

   <br>

8. 配置完成！

   ![image-20220402160319149](http://jing-image.test.upcdn.net/image-20220402160319149.png)

   <br>

## Q & A

### 1. 图片备份路径下只有一个名为 "undefined" 的文件

请将插件更新至 `v1.3.7` 版本及以上，详情参见 [Issue](https://github.com/Redns/picgo-plugin-autobackup/issues/1)
<br>

### 2. 备份至坚果云显示 "StatusCodeError 401"

配置项中需要的是 `应用密码` 而不是 `账户密码`，如何获取 `应用密码` 参见 `问题3↓`

<br>

### 3. 如何获取应用密码？

1. [点击这里](https://www.jianguoyun.com/#/safety) 前往坚果云安全选项界面，点击 `添加应用`

   ![image-20220402160849678](http://jing-image.test.upcdn.net/image-20220402160849678.png)
   =======
   - `备份空间`：用以区分备份的位置 (本地、云盘、……)，目前仅支持本地 (local)
   - `mark文件路径`：用于存储备份图片的相关信息以便后期恢复、重传，默认路径为 `{picgo安装目录}/mark.json`
   - `备份路径`：图片备份路径，默认存储路径为 `{picgo安装目录}/Images`

   <br>

2. 根据个人喜好填写 `名称`，点击 `生成密码`

   ![image-20220402161019859](http://jing-image.test.upcdn.net/image-20220402161019859.png)

   <br>

3. 点击 `完成`，生成的密码即为 `应用密码`

   ![image-20220402161139282](http://jing-image.test.upcdn.net/image-20220402161139282.png)

   <br>

### 4. 什么是 "mark" 文件

`mark.json` 文件记录了图片链接和备份图片的相关信息，当图片链接失效时可根据该文件追溯备份文件，进而进行重传等操作

