var fs = require('fs')
var path = require('path')

const pluginConfig = (ctx) => {
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')
    if (!userConfig) {
        throw new Error("[AutoBackup] 配置文件损坏")
    }
    // 获取配置文件中所有的 space 名称
    let spaceNames = []
    for(var i in userConfig.spaces){
        spaceNames.push(userConfig.spaces[i].name)
    }
    // 返回配置组件
    const config = [
        {
            name: 'space',
            type: 'list',
            alias: '备份空间',
            choices: spaceNames,
            default: userConfig.currentSpace || '',
            message: '备份空间不能为空',
            required: true
        },
        {
            name: 'markFilepath',
            type: 'input',
            alias: 'mark文件路径',
            default: userConfig.markFilepath || '',
            message: '请勿选择系统盘路径',
            required: true
        }
    ]
    return config
}


const markInfoConstruct = (space, path, url) => {
    return {
        'space': space,
        'path': path,
        'url': url,
        'time': Date.now()
    }
}


/**
 * 将数组数据写入文件
 * @param {文件路径} filePath 
 * @param {待写入的数组} buffer 
 * @param {错误回调函数} callback 
 */
const writeFileRecursive = function(filePath, buffer, callback){
    fs.mkdir(path.resolve(filePath, '..'), {recursive: true}, (err) => {
        if (err) return callback(err);
        fs.writeFile(filePath, buffer, function(err){
            if (err) return callback(err);
            callback(null);
        });
    });
}


/**
 * 备份图片到本地
 * @param {ctx}                     ctx
 * @param {图片备份文件夹}           imagePath 
 * @param {ctx.output数组成员对象}   imgObject 
 */
function backupInLocal(ctx, imagePath, imgObject){
    // 读取图片数据
    var img = imgObject.bufferCopy
    if((!img) && (imgObject.base64ImageCopy)){
        img = Buffer.from(imgObject.base64ImageCopy, 'base64')
    }

    // 写入文件
    writeFileRecursive(path.join(imagePath, imgObject.filename), Buffer.from(img), (err) => {
        if(err) ctx.log.error(`[Autobackup]本地备份失败，${err.message}`);
    });
}


/**
 * 创建 WebDAV 文件夹
 * @param {访问接口} url
 * @param {文件夹路径} path 
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const WebDAVDirectoryCreateRequestConstruct = (url, path, username, password) => {
    return {
        method: 'mkcol',
        url: `${url}/${path}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`
        },
        resolveWithFullResponse: true
    }
}


/**
 * 构建 WebDAV 文件上传请求
 * @param {图片备份文件夹} imagePath 
 * @param {图片上传对象} imageObject 
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const WebDAVUploadRequestConstruct = (url, imageDirectory, imageObject, username, password) => {
    // 读取图片数据
    var img = imageObject.bufferCopy
    if((!img) && (imageObject.base64ImageCopy)){
        img = Buffer.from(imageObject.base64ImageCopy, 'base64')
    }
    // 构造上传请求
    return {
        method: 'put',
        url: `${url}/${imageDirectory}/${imageObject.filename}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`,
          'Content-Type': `image/${imageObject.extname.substring(1)}`
        },
        data: Buffer.from(img.data),
        resolveWithFullResponse: true
    }
}


/**
 * 获取图片链接
 */
const afterUploadPlugins = {
    handle(ctx){
        // // 加载配置文件
        // const userConfig = ctx.getConfig('picgo-plugin-autobackup')
        // const settings = ctx.getConfig('picgo-plugin-autobackup-settings')             
        // // 加载 mark.json
        // fs.readFile(userConfig.markFilepath, async function(err, data){
        //     if(err){
        //         if(err.code === "ENOENT"){
        //             // 文件不存在
        //             // 判断设置的 mark 文件路径是否规范
        //             if(!userConfig.markFilepath.endsWith('mark.json')){
        //                 ctx.saveConfig({
        //                     'picgo-plugin-autobackup':{
        //                         space: userConfig.space,
        //                         markFilepath: path.join(userConfig.markFilepath, 'mark.json')
        //                     }
        //                 })
        //                 userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
        //             }
        //             // 创建 mark 文件
        //             writeFileRecursive(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", (err) => {
        //                 if(err) ctx.log.info(`[AutoBackup] mark.json 创建失败，${err.message}`)
        //             })
        //         }
        //         else if(err.code === "EISDIR"){
        //             // 设置的 mark 文件路径为文件夹
        //             ctx.saveConfig({
        //                 'picgo-plugin-autobackup':{
        //                     space: userConfig.space,
        //                     markFilepath: path.join(userConfig.markFilepath, 'mark.json')
        //                 }
        //             })
        //             userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
        //             // 创建 mark 文件
        //             writeFileRecursive(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", (err) => {
        //                 if(err) ctx.log.error(`[AutoBackup] mark.json 创建失败，${err.message}`)
        //             })
        //         }
        //         else{
        //             ctx.log.error(`[Autobackup] mark.json 加载失败，${err.message}`)
        //         }
        //     }
        //     // 修改 mark.json
        //     if(data){
        //         // 加载标记文件
        //         var markInfo =  JSON.parse(data.toString())
        //         // 修改标记文件
        //         var imgList = ctx.output
        //         for(var i in imgList){
        //             if(userConfig.space === "Local"){
        //                 backupInLocal(ctx, settings.local.imagePath, imgList[i])
        //                 markInfo.images.push(markInfoConstruct(userConfig.space, path.join(settings.local.imagePath, imgList[i].filename), imgList[i].imgUrl))
        //             }
        //             else if(userConfig.space === "NutStore"){
        //                 // 备份至坚果云
        //                 await ctx.request(WebDAVUploadRequestConstruct(settings.nutstore.imagePath, imgList[i], settings.nutstore.username, settings.nutstore.password)).then(() =>{
        //                     markInfo.images.push(markInfoConstruct(userConfig.space, `https://dav.jianguoyun.com/dav/${settings.nutstore.imagePath}/${imgList[i].filename}`, imgList[i].imgUrl))
        //                 }).catch(async (error) => {
        //                     if(error.statusCode === 409){
        //                         // 文件夹不存在
        //                         await ctx.request(WebDAVDirectoryCreateRequestConstruct(settings.nutstore.imagePath, settings.nutstore.username, settings.nutstore.password)).then(async () => {
        //                             await ctx.request(WebDAVUploadRequestConstruct(settings.nutstore.imagePath, imgList[i], settings.nutstore.username, settings.nutstore.password))
        //                             markInfo.images.push(markInfoConstruct(userConfig.space, `https://dav.jianguoyun.com/dav/${settings.nutstore.imagePath}/${imgList[i].filename}`, imgList[i].imgUrl))
        //                         }).catch((error) => {
        //                             ctx.log.error(`[AutoBackup] 坚果云备份指定的文件夹不存在且自动创建失败，${error.message}`)
        //                         })
        //                     }
        //                     else{
        //                         ctx.log.error(`[AutoBackup] 坚果云备份失败，${error.message}`)
        //                     }
        //                 })
        //             }
        //             // 清空图片缓冲区
        //             if(imgList[i].bufferCopy != undefined){
        //                 delete imgList[i].bufferCopy
        //             }
        //             if(imgList[i].base64ImageCopy != undefined){
        //                 delete imgList[i].base64ImageCopy
        //             }
        //         }
        //         markInfo.total = markInfo.total + imgList.length
        //         // 更新标记文件
        //         fs.writeFileSync(userConfig.markFilepath, JSON.stringify(markInfo))
        //     }
        // })
    }
}


/**
 * 部分uploader在上传图片后会清除图片数据, 因此选择在uploader前备份图片, 而在uploader后获取链接
 * @param {*} ctx 
 * @returns 
 */
const handle = async (ctx) => {
    // // 加载配置文件
    // const userConfig = ctx.getConfig('picgo-plugin-autobackup')

    // if (!userConfig) {
    //     throw new Error('请配置相关信息!')
    // }   
    // else{
    //     /**
    //      * 备份图片缓冲区，防止uploader上传完成后清空图片数据
    //      */
    //     var imgList = ctx.output
    //     for(var i in imgList){
    //         try{
    //             if(imgList[i].buffer != undefined){
    //                 imgList[i].bufferCopy = JSON.parse(JSON.stringify(imgList[i].buffer))
    //             }
    //             if(imgList[i].base64Image != undefined){
    //                 imgList[i].base64ImageCopy = JSON.parse(JSON.stringify(imgList[i].base64Image))
    //             }
    //         }
    //         catch(err){
    //             ctx.log.error(`[Autobackup]图片${imgList[i].filename}数组拷贝失败:${err.message}`)
    //         }
    //     }
    // }    
    return ctx
}


const spaceGuiMenuConstruct = (userConfig, spaceName) => {
    // 获取备份空间配置
    let spaceConfig = userConfig.spaces.find(s => s.name === spaceName)
    if(!spaceConfig){
        throw new Error(`[AutoBackup] 无法打开设置页面，未找到 ${spaceName} 的相关配置`)
    }
    // 根据备份空间类型返回 GUI 逻辑
    switch(spaceConfig.type.toLowerCase()){
        case 'local': return localSpaceGuiMenuConstruct(userConfig, spaceConfig)
        case 'webdav': return webDAVSpaceGuiMenuConstruct(userConfig, spaceConfig)
        default: throw new Error(`[AutoBackup] 无效的备份空间类型: ${spaceConfig.type}`)
    }
}


/**
 * 本地备份 GUI 配置逻辑
 * @param {插件配置} userConfig 
 * @param {备份空间配置} spaceConfig 
 * @returns 
 */
const localSpaceGuiMenuConstruct = (userConfig, spaceConfig) => {
    return {
        label: `配置 ${spaceConfig.name} 备份`,
        async handle (ctx, guiApi) {
            // 获取备份文件夹
            let imageDirectory = await guiApi.showInputBox({
                title: '请输入备份文件夹路径',
                placeholder: spaceConfig.config.path
            })
            spaceConfig.config.path = (imageDirectory === '') ? spaceConfig.config.path : imageDirectory;
            // 修改配置文件
            if(spaceConfig.config.path != ''){
                ctx.saveConfig({
                    'picgo-plugin-autobackup': userConfig
                })
                await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '保存成功',
                    type: 'info',
                    buttons: ['Yes']
                })
            }
        }
    }
}


/**
 * WebDAV 备份 GUI 配置逻辑
 * @param {插件配置} userConfig 
 * @param {备份空间配置} spaceConfig 
 * @returns 
 */
const webDAVSpaceGuiMenuConstruct = (userConfig, spaceConfig) => {
    return {
        label: `配置 ${spaceConfig.name} 备份`,
        async handle (ctx, guiApi) {
            // 访问接口
            // 坚果云：https://dav.jianguoyun.com/dav/
            // 局域网自建：{http or https}://{ip}:{port}
            // 其它
            let api = await guiApi.showInputBox({
                title: '访问接口（一般以 http/https 开头）',
                placeholder: spaceConfig.config.api
            })
            spaceConfig.config.api = (api === '') ? spaceConfig.config.api : api;
            // 账号
            // 坚果云为登录邮箱
            let username = await guiApi.showInputBox({
                title: '账号',
                placeholder: spaceConfig.config.username
            })
            spaceConfig.config.username = (username === '') ? spaceConfig.config.username : username;
            // 密码
            // 坚果云为应用密码
            let password = await guiApi.showInputBox({
                title: '密码',
                placeholder: spaceConfig.config.password
            })
            spaceConfig.config.password = (password === '') ? spaceConfig.config.password : password;
            // 备份文件夹
            let imageDirectory = await guiApi.showInputBox({
                title: "备份文件夹（多层请使用 '/' 分隔符）",
                placeholder: spaceConfig.config.path
            })
            spaceConfig.config.path = (imageDirectory === '') ? spaceConfig.config.path : imageDirectory
            // 修改配置文件
            if((spaceConfig.config.api.startsWith('http') || spaceConfig.config.api.startsWith('https')) &&
               (spaceConfig.config.username != '') && (spaceConfig.config.password != '') && (spaceConfig.config.path != '')){
                ctx.saveConfig({
                    'picgo-plugin-autobackup': userConfig
                })
                await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '保存成功',
                    type: 'info',
                    buttons: ['Yes']
                })
            }
        }
    }
}



/**
 * GUI 设置
 * @param {*} ctx 
 * @returns 
 */
const guiMenu = (ctx) => {
    let guiMenus = []
    let userConfig = ctx.getConfig('picgo-plugin-autobackup')
    for(var i in userConfig.spaces){
        guiMenus.push(spaceGuiMenuConstruct(userConfig, userConfig.spaces[i].name))
    }
    return guiMenus
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.info('[AutoBackup] 加载中...')
        let userConfig = ctx.getConfig('picgo-plugin-autobackup')
        // 默认设置信息
        if(!userConfig){
            userConfig = {
                currentSpace: 'Local',
                markFilepath: 'Autobackup/mark.json',
                spaces: [
                    {
                        name: 'Local',
                        type: 'local',
                        config: {
                            path: 'AutoBackup/Images'
                        }
                    }
                ]
            }
            ctx.saveConfig({
                'picgo-plugin-autobackup': userConfig
            })
        }
        // 兼容旧版本设置
        if(!userConfig.spaces){
            const oldSettings = ctx.getConfig('picgo-plugin-autobackup-settings')
            if(!oldSettings){
                throw new Error('[AutoBackup] 配置文件损坏，未找到备份空间配置信息')
            }
            // 迁移设置
            userConfig = {
                currentSpace: userConfig.space,
                markFilepath: userConfig.markFilepath,
                spaces: [
                    {
                        name: 'Local',
                        type: 'local',
                        config: {
                            path: oldSettings.local.imagePath
                        }
                    },
                    {
                        name: 'NutStore',
                        type: 'webdav',
                        config: {
                            api: 'https://dav.jianguoyun.com/dav/',
                            username: oldSettings.nutstore.username,
                            password: oldSettings.nutstore.password,
                            path: oldSettings.nutstore.imagePath
                        }
                    }
                ]
            }
            ctx.saveConfig({
                'picgo-plugin-autobackup': userConfig
            })
        }
        // 注册插件
        ctx.helper.beforeUploadPlugins.register('autobackup', {
            handle,
            config: pluginConfig
        })
        ctx.helper.afterUploadPlugins.register('autobackup', afterUploadPlugins)
        ctx.log.success('[Autobackup] 加载成功')
    }
    return {
        register,
        config: pluginConfig,
        guiMenu,
        beforeUploadPlugins: 'autobackup',
        afterUploadPlugins: 'autobackup'
    }
}