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
 * 构建 WebDAV 文件夹创建请求
 * @param {图片访问接口} url
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const webDAVDirectoryCreateRequestConstruct = (url, username, password) => {
    return {
        method: 'mkcol',
        url: url,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`
        },
        resolveWithFullResponse: true
    }
}


/**
 * 构建 WebDAV 文件上传请求
 * @param {图片访问接口} url 
 * @param {图片上传对象} imageObject 
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const webDAVUploadRequestConstruct = (url, imageObject, username, password) => {
    // 读取图片数据
    var img = imageObject.bufferCopy
    if((!img) && (imageObject.base64ImageCopy)){
        img = Buffer.from(imageObject.base64ImageCopy, 'base64')
    }
    // 构造上传请求
    return {
        method: 'put',
        url: url,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`,
          'Content-Type': `image/${imageObject.extname.substring(1)}`
        },
        data: Buffer.from(img.data),
        resolveWithFullResponse: true
    }
}


/**
 * 构建 WebDAV 文件删除请求
 * @param {图片备份文件夹} imagePath 
 * @param {图片上传对象} imageObject 
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const webDAVDeleteRequestConstruct = (url, username, password) => {
    return {
        method: 'delete',
        url: url,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`
        },
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
                    if(currentSpaceConfig.type === 'local'){
                        // 备份至本地文件夹
                        backupInLocal(ctx, currentSpaceConfig.config.path, imgList[i])
                        markInfo.images.push(markInfoConstruct(currentSpaceConfig.name, path.join(currentSpaceConfig.config.path, imgList[i].uniqueName), imgList[i].imgUrl))
                    }
                    else if(currentSpaceConfig.type === "webdav"){
                        // 备份至 WebDAV
                        const imageAccessUrl = spliceLinks([currentSpaceConfig.config.api, currentSpaceConfig.config.path, imgList[i].uniqueName])
                        await ctx.request(webDAVUploadRequestConstruct(imageAccessUrl, imgList[i], currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(() =>{
                            markInfo.images.push(markInfoConstruct(currentSpaceConfig.name, imageAccessUrl, imgList[i].imgUrl))
                        }).catch(async (error) => {
                            if(error.statusCode === 409){
                                // 文件夹不存在
                                await ctx.request(webDAVDirectoryCreateRequestConstruct(spliceLinks([currentSpaceConfig.config.api, currentSpaceConfig.config.path]), currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(async () => {
                                    await ctx.request(webDAVUploadRequestConstruct(imageAccessUrl, imgList[i], currentSpaceConfig.config.username, currentSpaceConfig.config.password)).then(() => {
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
    return {
        label: `配置${spaceConfig.name}备份`,
        async handle(ctx, guiApi){
            switch(spaceConfig.type.toLowerCase()){
                case 'local': await localSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig)
                case 'webdav': await webDAVSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig)
                default: throw new Error(`[AutoBackup] 无效的备份空间类型: ${spaceConfig.type}`)
            }
        }
    }
}


/**
 * 本地备份 GUI 逻辑
 * @param {*} ctx 
 * @param {*} guiApi 
 * @param {全部备份空间配置} spacesConfig 
 * @param {当前本地备份空间配置} spaceConfig 
 * @returns 
 */
async function localSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig){
    // 加载全局设置
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')
    // 备份空间名称
    let spaceName = await guiApi.showInputBox({
        title: '备份空间名称（键入 DELETE 以删除）',
        placeholder: spaceConfig.name
    })
    // 删除当前备份空间
    if(spaceName === 'DELETE'){
        const deleteSpace = await guiApi.showMessageBox({
            title: 'Autobackup',
            message: `确定删除${spaceConfig.name}备份空间？`,
            type: 'info',
            buttons: ['Yes', 'No']
        })
        if(deleteSpace.result === 1){
            return
        }
        // 当前备份空间若在使用中，则需要修改全局配置文件
        if(userConfig.space === spaceConfig.name){
            // 至少保留一个备份空间
            if(spacesConfig.length === 1){
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '删除失败，至少需要一个备份空间！',
                    type: 'error',
                    buttons: ['Yes']
                })
            }
            else{
                userConfig.space = spacesConfig.filter(s => s.name != spaceConfig.name)[0].name
                ctx.saveConfig({
                    'picgo-plugin-autobackup': userConfig
                })
            }
        }
        // 移除该备份空间涉及的所有图片
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(data){
                // 更新 mark 文件
                let markInfo =  JSON.parse(data.toString())
                let removeImages = markInfo.images.filter(i => i.space === spaceConfig.name)
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify({
                    total: markInfo.total - removeImages.length,
                    images: markInfo.images.filter(i => i.space != spaceConfig.name)
                }))
                // 删除备份图片
                for(var removeImageIndex in removeImages){
                    fs.unlink(removeImages[removeImageIndex].path, (err) => {
                        ctx.log.error(`[AutoBackup] 移除${spaceConfig.name}备份空间时，无法删除图片${removeImages[removeImageIndex].path}, ${err.message}`)
                    })
                }
            }
        })
        // 更新备份空间设置
        spacesConfig = spacesConfig.filter(s => s.name != spaceConfig.name)
        ctx.saveConfig({
            'picgo-plugin-autobackup-spaces': spacesConfig
        })
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '删除成功',
            type: 'info',
            buttons: ['Yes']
        }) 
    }
    // 检查备份空间名称是否合法
    if((spaceName === '') && (spaceConfig.name === '')){
        spacesConfig = spacesConfig.filter(s => s != spaceConfig)
        ctx.saveConfig({
            'picgo-plugin-autobackup-spaces': spacesConfig
        })
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '备份空间名称不能为空',
            type: 'error',
            buttons: ['Yes']
        }) 
    } 
    // 检查备份空间名称是否重复
    if((spaceName != '') && (spacesConfig.find(s => s.name === spaceName) != undefined)){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '备份空间命名重复！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 备份文件夹
    let imageDirectory = await guiApi.showInputBox({
        title: '请输入备份文件夹路径',
        placeholder: spaceConfig.config.path
    })
    spaceConfig.config.path = (imageDirectory != '') ? imageDirectory : spaceConfig.config.path
    if(spaceConfig.config.path === ''){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '文件夹路径不能为空！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 更新 Mark 文件
    if(spaceName != ''){
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(err){
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '修改失败，Mark 文件损坏！',
                    type: 'error',
                    buttons: ['Yes']
                }) 
            }
            if(data){
                // 更新 mark 文件
                let markInfo =  JSON.parse(data.toString())
                let relevantImages = markInfo.images.filter(i => i.space === spaceConfig.name)
                for(var relevantImagesIndex in relevantImages){
                    relevantImages[relevantImagesIndex].space = spaceName
                }
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify(markInfo))
                // 修改配置文件
                if(userConfig.space === spaceConfig.name){
                    userConfig.space = spaceName
                    ctx.saveConfig({
                        'picgo-plugin-autobackup': userConfig
                    })
                }
                spaceConfig.name = spaceName
                ctx.saveConfig({
                    'picgo-plugin-autobackup-spaces': spacesConfig
                })
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: `完成`,
                    type: 'info',
                    buttons: ['Yes']
                })
            }
        })
    }
}


/**
 * WebDAV 备份 GUI 配置逻辑
 * @param {*} ctx 
 * @param {*} guiApi 
 * @param {全部备份空间配置} spacesConfig 
 * @param {当前本地备份空间配置} spaceConfig  
 * @returns 
 */
async function webDAVSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig){
    // 加载全局设置
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')
    // 备份空间名称
    let spaceName = await guiApi.showInputBox({
        title: '备份空间名称（键入 DELETE 以删除）',
        placeholder: spaceConfig.name
    })
    // 删除当前备份空间
    if(spaceName === 'DELETE'){
        const deleteSpace = await guiApi.showMessageBox({
            title: 'Autobackup',
            message: `确定删除${spaceConfig.name}备份空间？`,
            type: 'info',
            buttons: ['Yes', 'No']
        })
        if(deleteSpace.result === 1){
            return
        }
        // 当前备份空间若在使用中，则需要修改全局配置文件
        if(userConfig.space === spaceConfig.name){
            // 至少保留一个备份空间
            if(spacesConfig.length === 1){
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '删除失败，至少需要一个备份空间！',
                    type: 'error',
                    buttons: ['Yes']
                })
            }
            else{
                userConfig.space = spacesConfig.filter(s => s.name != spaceConfig.name)[0].name
                ctx.saveConfig({
                    'picgo-plugin-autobackup': userConfig
                })
            }
        }
        // 移除该备份空间涉及的所有图片
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(data){
                // 更新 mark 文件
                let markInfo =  JSON.parse(data.toString())
                let removeImages = markInfo.images.filter(i => i.space === spaceConfig.name)
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify({
                    total: markInfo.total - removeImages.length,
                    images: markInfo.images.filter(i => i.space != spaceConfig.name)
                }))
                // 删除备份图片
                for(var removeImageIndex in removeImages){
                    await ctx.request(webDAVDeleteRequestConstruct(removeImages[removeImageIndex].path, spaceConfig.config.username, spaceConfig.config.password)).then(() =>{    
                    }).catch((err) => {
                        ctx.log.error(`[AutoBackup] 移除${spaceConfig.name}备份空间时，无法删除图片${removeImages[removeImageIndex].path}, ${err.message}`)
                    })
                }
            }
        })
        // 更新备份空间设置
        spacesConfig = spacesConfig.filter(s => s.name != spaceConfig.name)
        ctx.saveConfig({
            'picgo-plugin-autobackup-spaces': spacesConfig
        })
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '删除成功',
            type: 'info',
            buttons: ['Yes']
        }) 
    }
    // 检查备份空间名称是否合法
    if((spaceName === '') && (spaceConfig.name === '')){
        spacesConfig = spacesConfig.filter(s => s != spaceConfig)
        ctx.saveConfig({
            'picgo-plugin-autobackup-spaces': spacesConfig
        })
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '备份空间名称不能为空',
            type: 'error',
            buttons: ['Yes']
        }) 
    } 
    // 检查备份空间名称是否重复
    if((spaceName != '') && (spacesConfig.find(s => s.name === spaceName) != undefined)){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '备份空间命名重复！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 访问接口
    // 坚果云：https://dav.jianguoyun.com/dav/
    // 局域网自建：{http or https}://{ip}:{port}
    // 其它
    let api = await guiApi.showInputBox({
        title: '访问接口（一般以 http/https 开头）',
        placeholder: spaceConfig.config.api
    })
    spaceConfig.config.api = (api != '') ? api : spaceConfig.config.api
    if(((!spaceConfig.config.api.startsWith('http://')) && (!spaceConfig.config.api.startsWith('https://'))) || (spaceConfig.config.api.indexOf('\\') > -1)){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '访问接口格式错误！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 账号
    // 坚果云为登录邮箱
    let username = await guiApi.showInputBox({
        title: '账号',
        placeholder: spaceConfig.config.username
    })
    spaceConfig.config.username = (username != '') ? username : spaceConfig.config.username
    if(spaceConfig.config.username === ''){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '账号不能为空！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 密码
    // 坚果云为应用密码
    let password = await guiApi.showInputBox({
        title: '密码',
        placeholder: spaceConfig.config.password
    })
    spaceConfig.config.password = (password != '') ? password : spaceConfig.config.password
    if(spaceConfig.config.password === ''){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '密码不能为空！',
            type: 'error',
            buttons: ['Yes']
        })  
    }
    // 备份文件夹
    let imageDirectory = await guiApi.showInputBox({
        title: "备份文件夹（多层请使用 '/' 分隔符）",
        placeholder: spaceConfig.config.path
    })
    spaceConfig.config.path = (imageDirectory != '') ? imageDirectory : spaceConfig.config.path
    if((spaceConfig.config.path === '') || (spaceConfig.config.path.indexOf('\\') > -1)){
        return guiApi.showMessageBox({
            title: 'Autobackup',
            message: '备份文件夹格式错误！',
            type: 'error',
            buttons: ['Yes']
        })
    }
    // 更新 Mark 文件
    if(spaceName != ''){
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(err){
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: '修改失败，Mark 文件损坏！',
                    type: 'error',
                    buttons: ['Yes']
                }) 
            }
            if(data){
                // 更新 mark 文件
                let markInfo =  JSON.parse(data.toString())
                let relevantImages = markInfo.images.filter(i => i.space === spaceConfig.name)
                for(var relevantImagesIndex in relevantImages){
                    relevantImages[relevantImagesIndex].space = spaceName
                }
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify(markInfo))
                // 修改配置文件
                if(userConfig.space === spaceConfig.name){
                    userConfig.space = spaceName
                    ctx.saveConfig({
                        'picgo-plugin-autobackup': userConfig
                    })
                }
                spaceConfig.name = spaceName
                ctx.saveConfig({
                    'picgo-plugin-autobackup-spaces': spacesConfig
                })
                return guiApi.showMessageBox({
                    title: 'Autobackup',
                    message: `完成`,
                    type: 'info',
                    buttons: ['Yes']
                })
            }
        })
    }
}


/**
 * 新增备份空间
 * @param {备份空间设置} spacesConfig 
 * @returns 
 */
const addSpaceGuiMenuConstruct = (spacesConfig) => {
    return {
        label: '新增备份空间',
        async handle (ctx, guiApi){
            // 选择备份空间类型
            const spaceType = await guiApi.showMessageBox({
                title: 'Autobackup',
                message: '请选择备份空间类型',
                type: 'info',
                buttons: ['local', 'webdav', '取消']
            })
            switch(spaceType.result){
                case 0: {
                    let spaceConfig = {
                        name: '',
                        type: 'local',
                        config: {
                            'path': ''
                        }
                    }
                    spacesConfig.push(spaceConfig)
                    return localSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig)
                }
                case 1: {
                    let spaceConfig = {
                        name: '',
                        type: 'webdav',
                        config: {
                            'api': 'https://',
                            'username': '',
                            'password': '',
                            'path': ''
                        }
                    }
                    spacesConfig.push(spaceConfig)
                    return webDAVSpaceGuiMenu(ctx, guiApi, spacesConfig, spaceConfig)
                }
                default: return
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
    const guiMenus = []
    const spacesConfig = ctx.getConfig('picgo-plugin-autobackup-spaces')
    for(var i in spacesConfig){
        guiMenus.push(spaceGuiMenuConstruct(spacesConfig, spacesConfig[i]))
    }
    guiMenus.push(addSpaceGuiMenuConstruct(spacesConfig))
    return guiMenus
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.info('[AutoBackup] 加载中...')
        // 检查全局配置
        if(!ctx.getConfig('picgo-plugin-autobackup')){
            ctx.saveConfig({
                'picgo-plugin-autobackup': {
                    space: 'Local',
                    markFilepath: 'Autobackup/mark.json'
                }
            })
        }
        // 兼容旧版本设置
        if(!ctx.getConfig('picgo-plugin-autobackup-spaces')){
            const oldSettings = ctx.getConfig('picgo-plugin-autobackup-settings')
            if(!oldSettings){
                throw new Error('[AutoBackup] 配置文件损坏，未找到备份空间配置信息')
            }
            ctx.saveConfig({
                'picgo-plugin-autobackup-spaces': [
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