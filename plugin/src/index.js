var fs = require('fs')
var path = require('path')

const pluginConfig = (ctx) => {
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')
    const spacesConfig = ctx.getConfig('picgo-plugin-autobackup-spaces')
    if ((!userConfig) || (!spacesConfig)) {
        throw new Error("[AutoBackup] 配置文件缺失")
    }
    // 获取配置文件中所有的 space 名称
    let spaceNames = []
    for(var i in spacesConfig){
        spaceNames.push(spacesConfig[i].name)
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


/**
 * Mark 信息构造
 * @param {备份空间名称} space 
 * @param {备份地址} path 
 * @param {图片链接} url 
 * @returns 
 */
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
    writeFileRecursive(path.join(imagePath, imgObject.uniqueName), Buffer.from(img), (err) => {
        if(err) ctx.log.error(`[Autobackup]本地备份失败，${err.message}`);
    });
}


/**
 * URL 拼接
 * @param {待拼接的链接} links 
 * @returns 
 */
function spliceLinks(links){
    let link = ''
    for(var i in links){
        if(links[i].startsWith('/')){
            links[i] = links[i].slice(1)
        }
        if(links[i].endsWith('/')){
            links[i] = links[i].slice(0, links[i].length - 1)
        }
        link += `${links[i]}/`
    }
    return link.slice(0, link.length - 1)
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
        url: spliceLinks([url, path]),
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
        url: spliceLinks([url, imageDirectory, imageObject.uniqueName]),
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
        // 加载配置文件
        const userConfig = ctx.getConfig('picgo-plugin-autobackup')
        const spacesConfig = ctx.getConfig('picgo-plugin-autobackup-spaces')
        const currentSpaceConfig = spacesConfig.find(s => s.name === userConfig.space)  
        if(!currentSpaceConfig){
            throw new Error(`[AutoBackup] 未找到备份空间 ${userConfig.space} 配置`)
        }       
        // 加载 mark.json
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(err){
                if(err.code === "ENOENT"){
                    // 文件不存在
                    // 判断设置的 mark 文件路径是否规范
                    if(!userConfig.markFilepath.endsWith('mark.json')){
                        userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
                        ctx.saveConfig({
                            'picgo-plugin-autobackup': userConfig
                        })
                    }
                    // 创建 mark 文件
                    writeFileRecursive(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", (err) => {
                        if(err) ctx.log.info(`[AutoBackup] mark.json 创建失败，${err.message}`)
                    })
                }
                else if(err.code === "EISDIR"){
                    // 设置的 mark 文件路径为文件夹
                    userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
                    ctx.saveConfig({
                        'picgo-plugin-autobackup': userConfig
                    })
                    // 创建 mark 文件
                    writeFileRecursive(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", (err) => {
                        if(err) ctx.log.error(`[AutoBackup] mark.json 创建失败，${err.message}`)
                    })
                }
                else{
                    ctx.log.error(`[Autobackup] mark.json 加载失败，${err.message}`)
                }
            }
            // 修改 mark.json
            if(data){
                // 加载标记文件
                var markInfo =  JSON.parse(data.toString())
                // 修改标记文件
                var imgList = ctx.output
                for(var i in imgList){
                    if(currentSpaceConfig.type.toLowerCase() === 'local'){
                        // 备份至本地文件夹
                        backupInLocal(ctx, currentSpaceConfig.config.path, imgList[i])
                        markInfo.images.push(markInfoConstruct(currentSpaceConfig.name, path.join(currentSpaceConfig.config.path, imgList[i].uniqueName), imgList[i].imgUrl))
                    }
                    else if(currentSpaceConfig.type.toLowerCase() === "webdav"){
                        // 备份至 WebDAV
                        const imageAccessUrl = spliceLinks([currentSpaceConfig.config.api, currentSpaceConfig.config.path, imgList[i].uniqueName])
                        await ctx.request(WebDAVUploadRequestConstruct(currentSpaceConfig.config.api, currentSpaceConfig.config.path, imgList[i], currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(() =>{
                            markInfo.images.push(markInfoConstruct(currentSpaceConfig.name, imageAccessUrl, imgList[i].imgUrl))
                        }).catch(async (error) => {
                            if(error.statusCode === 409){
                                // 文件夹不存在
                                await ctx.request(WebDAVDirectoryCreateRequestConstruct(currentSpaceConfig.config.api, currentSpaceConfig.config.path, currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(async () => {
                                    await ctx.request(WebDAVUploadRequestConstruct(currentSpaceConfig.config.path, imgList[i], currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(() => {
                                        markInfo.images.push(markInfoConstruct(currentSpaceConfig.name, imageAccessUrl, imgList[i].imgUrl))
                                    })
                                }).catch((error) => {
                                    ctx.log.error(`[AutoBackup] WebDAV 备份指定的文件夹不存在且自动创建失败，${error.message}`)
                                })
                            }
                            else{
                                ctx.log.error(`[AutoBackup] WebDAV 备份失败，${error.message}`)
                            }
                        })
                    }
                    // 清空图片缓冲区
                    if(imgList[i].bufferCopy != undefined){
                        delete imgList[i].bufferCopy
                    }
                    if(imgList[i].base64ImageCopy != undefined){
                        delete imgList[i].base64ImageCopy
                    }
                }
                markInfo.total = markInfo.total + imgList.length
                // 更新标记文件
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify(markInfo))
            }
        })
    }
}


/**
 * 备份图片数据
 * 部分 uploader 上传完成后会清空图片数据
 * @param {*} ctx 
 * @returns 
 */
const handle = async (ctx) => { 
    var imgList = ctx.output
    var date = new Date()
    for(var i in imgList){
        if(imgList[i].buffer != undefined){
            imgList[i].bufferCopy = JSON.parse(JSON.stringify(imgList[i].buffer))
        }
        else if(imgList[i].base64Image != undefined){
            imgList[i].base64ImageCopy = JSON.parse(JSON.stringify(imgList[i].base64Image))
        }
        else{
            throw new Error('[AutoBackup] 无法备份，图片数据为空')
        }
        imgList[i].uniqueName = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}${imgList[i].extname}`
    }   
    return ctx
}


/**
 * 备份空间 GUI 配置逻辑
 * @param {插件配置} userConfig 
 * @param {备份空间名称} spaceName 
 * @returns 
 */
const spaceGuiMenuConstruct = (spacesConfig, spaceConfig) => {
    // 根据备份空间类型返回 GUI 逻辑
    switch(spaceConfig.type.toLowerCase()){
        case 'local': return localSpaceGuiMenuConstruct(spacesConfig, spaceConfig)
        case 'webdav': return webDAVSpaceGuiMenuConstruct(spacesConfig, spaceConfig)
        default: throw new Error(`[AutoBackup] 无效的备份空间类型: ${spaceConfig.type}`)
    }
}


/**
 * 本地备份 GUI 配置逻辑
 * @param {插件配置} userConfig 
 * @param {备份空间配置} currentSpaceConfig 
 * @returns 
 */
const localSpaceGuiMenuConstruct = (spacesConfig, spaceConfig) => {
    return {
        label: `配置${spaceConfig.name}备份`,
        async handle (ctx, guiApi) {
            // 备份空间名称
            let spaceName = await guiApi.showInputBox({
                title: '备份空间名称（键入 DELETE 以删除）',
                placeholder: spaceConfig.name
            })
            // 删除当前备份空间
            if(spaceName === 'DELETE'){
                const deleteSpace = await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: `删除 ${spaceConfig.name} 备份空间？`,
                    type: 'info',
                    buttons: ['Yes', 'No']
                })
                if(deleteSpace.result === 0){
                    spacesConfig = spacesConfig.filter(s => s != spaceConfig)
                    ctx.saveConfig({
                        'picgo-plugin-autobackup-spaces': spacesConfig
                    })
                    await guiApi.showMessageBox({
                        title: 'Autobackup',
                        message: '删除成功',
                        type: 'success',
                        buttons: ['Yes']
                    })  
                    return
                }
                spaceName = spaceConfig.name
            }
            // 更新备份空间名称
            if((spaceName != '') && (spacesConfig.find(s => s.name === spaceName) != undefined)){
                await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '备份空间命名重复',
                    type: 'error',
                    buttons: ['Yes']
                })  
                return
            }
            spaceConfig.name = (spaceName != '') ? spaceName : spaceConfig.name
            // 获取备份文件夹
            let imageDirectory = await guiApi.showInputBox({
                title: '请输入备份文件夹路径',
                placeholder: spaceConfig.config.path
            })
            spaceConfig.config.path = (imageDirectory === '') ? spaceConfig.config.path : imageDirectory
            // 修改配置文件
            ctx.saveConfig({
                'picgo-plugin-autobackup-spaces': spacesConfig
            })
        }
    }
}


/**
 * WebDAV 备份 GUI 配置逻辑
 * @param {插件配置} userConfig 
 * @param {备份空间配置} currentSpaceConfig 
 * @returns 
 */
const webDAVSpaceGuiMenuConstruct = (spacesConfig, spaceConfig) => {
    return {
        label: `配置${spaceConfig.name}备份`,
        async handle (ctx, guiApi){
            // 备份空间名称
            let spaceName = await guiApi.showInputBox({
                title: '备份空间名称（键入 DELETE 以删除）',
                placeholder: spaceConfig.name
            })
            // 删除当前备份空间
            if(spaceName === 'DELETE'){
                const deleteSpace = await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: `删除 ${spaceConfig.name} 备份空间？`,
                    type: 'info',
                    buttons: ['Yes', 'No']
                })
                if(deleteSpace.result === 0){
                    spacesConfig = spacesConfig.filter(s => s != spaceConfig)
                    ctx.saveConfig({
                        'picgo-plugin-autobackup-spaces': spacesConfig
                    })
                    await guiApi.showMessageBox({
                        title: 'Autobackup',
                        message: '删除成功',
                        type: 'success',
                        buttons: ['Yes']
                    })  
                    return
                }
                spaceName = spaceConfig.name
            }
            // 更新备份空间名称
            if((spaceName != '') && (spacesConfig.find(s => s.name === spaceName) != undefined)){
                await guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '备份空间命名重复',
                    type: 'error',
                    buttons: ['Yes']
                })  
                return
            }
            spaceConfig.name = (spaceName != '') ? spaceName : spaceConfig.name
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
            ctx.saveConfig({
                'picgo-plugin-autobackup-spaces': spacesConfig
            })
        }
    }
}


const addSpaceGuiMenuConstruct = () => {
    return {
        label: `创建`,
        async handle (ctx, guiApi){
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
    let spacesConfig = ctx.getConfig('picgo-plugin-autobackup-spaces')
    for(var i in spacesConfig){
        guiMenus.push(spaceGuiMenuConstruct(spacesConfig, spacesConfig[i]))
    }
    return guiMenus
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.info('[AutoBackup] 加载中...')
        // 检查全局配置
        let userConfig = ctx.getConfig('picgo-plugin-autobackup')
        if(!userConfig){
            userConfig = {
                space: 'Local',
                markFilepath: 'Autobackup/mark.json'
            }
            ctx.saveConfig({
                'picgo-plugin-autobackup': userConfig
            })
        }
        // 兼容旧版本设置
        let spacesConfig = ctx.getConfig('picgo-plugin-autobackup-spaces')
        if(!spacesConfig){
            const oldSettings = ctx.getConfig('picgo-plugin-autobackup-settings')
            if(!oldSettings){
                throw new Error('[AutoBackup] 配置文件损坏，未找到备份空间配置信息')
            }
            // 迁移设置
            spacesConfig = [
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
            ctx.saveConfig({
                'picgo-plugin-autobackup-spaces': spacesConfig
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