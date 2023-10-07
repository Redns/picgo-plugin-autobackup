var fs = require('fs')
var path = require('path')

const pluginConfig = (ctx) => {
    let userConfig = ctx.getConfig('picgo-plugin-autobackup')
    if (!userConfig) {
        userConfig = {}
    }
    const config = [
        {
            name: 'space',
            type: 'list',
            alias: '备份空间',
            choices: ["Local", "NutStore"],
            default: userConfig.space || '',
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
 * 
 * @param {文件路径}       filePath 
 * @param {待写入的数组}    buffer 
 * @param {回调函数}        callback 
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
 * 创建坚果云文件夹
 * @param {文件夹路径} path 
 * @param {用户邮箱} username 
 * @param {应用密码} password 
 * @returns 
 */
const NutStoreDirectoryCreateConstruct = (path, username, password) => {
    return {
        method: 'mkcol',
        url: `https://dav.jianguoyun.com/dav/${path}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`
        },
        resolveWithFullResponse: true
    }
}


/**
 * 构建坚果云上传文件请求
 * @param {图片备份文件夹}      imagePath 
 * @param {图片上传数组对象}    imageObject 
 * @param {用户邮箱}        username 
 * @param {应用密码}      password 
 * @returns 
 */
const NutStoreUploadConstruct = (imagePath, imageObject, username, password) => {
    // 读取图片数据
    var img = imageObject.bufferCopy
    if((!img) && (imageObject.base64ImageCopy)){
        img = Buffer.from(imageObject.base64ImageCopy, 'base64')
    }
    // 构造上传请求
    return {
        method: 'put',
        url: `https://dav.jianguoyun.com/dav/${imagePath}/${imageObject.filename}`,
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
        const settings = ctx.getConfig('picgo-plugin-autobackup-settings')             
        // 加载 mark.json
        fs.readFile(userConfig.markFilepath, async function(err, data){
            if(err){
                if(err.code === "ENOENT"){
                    // 文件不存在
                    // 判断设置的 mark 文件路径是否规范
                    if(!userConfig.markFilepath.endsWith('mark.json')){
                        ctx.saveConfig({
                            'picgo-plugin-autobackup':{
                                space: userConfig.space,
                                markFilepath: path.join(userConfig.markFilepath, 'mark.json')
                            }
                        })
                        userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
                    }
                    // 创建 mark 文件
                    writeFileRecursive(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", (err) => {
                        if(err) ctx.log.info(`[AutoBackup] mark.json 创建失败，${err.message}`)
                    })
                }
                else if(err.code === "EISDIR"){
                    // 设置的 mark 文件路径为文件夹
                    ctx.saveConfig({
                        'picgo-plugin-autobackup':{
                            space: userConfig.space,
                            markFilepath: path.join(userConfig.markFilepath, 'mark.json')
                        }
                    })
                    userConfig.markFilepath = path.join(userConfig.markFilepath, 'mark.json')
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
                    if(userConfig.space === "Local"){
                        backupInLocal(ctx, settings.local.imagePath, imgList[i])
                        markInfo.images.push(markInfoConstruct(userConfig.space, path.join(settings.local.imagePath, imgList[i].filename), imgList[i].imgUrl))
                    }
                    else if(userConfig.space === "NutStore"){
                        // 备份至坚果云
                        await ctx.request(NutStoreUploadConstruct(settings.nutstore.imagePath, imgList[i], settings.nutstore.username, settings.nutstore.password)).then(() =>{
                            markInfo.images.push(markInfoConstruct(userConfig.space, `https://dav.jianguoyun.com/dav/${settings.nutstore.imagePath}/${imgList[i].filename}`, imgList[i].imgUrl))
                        }).catch(async (error) => {
                            if(error.statusCode === 409){
                                // 文件夹不存在
                                await ctx.request(NutStoreDirectoryCreateConstruct(settings.nutstore.imagePath, settings.nutstore.username, settings.nutstore.password)).then(async () => {
                                    await ctx.request(NutStoreUploadConstruct(settings.nutstore.imagePath, imgList[i], settings.nutstore.username, settings.nutstore.password))
                                    markInfo.images.push(markInfoConstruct(userConfig.space, `https://dav.jianguoyun.com/dav/${settings.nutstore.imagePath}/${imgList[i].filename}`, imgList[i].imgUrl))
                                }).catch((error) => {
                                    ctx.log.error(`[AutoBackup] 坚果云备份指定的文件夹不存在且自动创建失败，${error.message}`)
                                })
                            }
                            else{
                                ctx.log.error(`[AutoBackup] 坚果云备份失败，${error.message}`)
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
 * 部分uploader在上传图片后会清除图片数据, 因此选择在uploader前备份图片, 而在uploader后获取链接
 * @param {*} ctx 
 * @returns 
 */
const handle = async (ctx) => {
    // 加载配置文件
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')

    if (!userConfig) {
        throw new Error('请配置相关信息!')
    }   
    else{
        /**
         * 备份图片缓冲区，防止uploader上传完成后清空图片数据
         */
        var imgList = ctx.output
        for(var i in imgList){
            try{
                if(imgList[i].buffer != undefined){
                    imgList[i].bufferCopy = JSON.parse(JSON.stringify(imgList[i].buffer))
                }
                if(imgList[i].base64Image != undefined){
                    imgList[i].base64ImageCopy = JSON.parse(JSON.stringify(imgList[i].base64Image))
                }
            }
            catch(err){
                ctx.log.error(`[Autobackup]图片${imgList[i].filename}数组拷贝失败:${err.message}`)
            }
        }
    }    
    return ctx
}


/**
 * GUI 设置
 * @param {*} ctx 
 * @returns 
 */
const guiMenu = ctx => {
    return [
        {
            label: '配置本地备份',
            async handle (ctx, guiApi) {
                // 加载本地设置
                const settings = ctx.getConfig('picgo-plugin-autobackup-settings')
                const imagePath = await guiApi.showInputBox({
                    title: '请输入图片备份路径',
                    placeholder: settings.local.imagePath || ""
                })

                // 修改配置文件
                if((imagePath != undefined) && (imagePath != "")){
                    ctx.saveConfig({
                        'picgo-plugin-autobackup-settings':{
                            local:{
                                "imagePath": imagePath
                            },
                            nutstore:{
                                username: settings.nutstore.username,
                                password: settings.nutstore.password,
                                imagePath: settings.nutstore.imagePath
                            }
                        }
                    })
                }
                else if(settings.local.imagePath === ""){
                    await guiApi.showMessageBox({
                        title: 'Autobackup',
                        message: '备份文件夹不能为空！',
                        type: 'error',
                        buttons: ['Yes']
                    })
                }
            }
        },
        {
            label: '配置坚果云备份',
            async handle (ctx, guiApi) {
                const settings = ctx.getConfig('picgo-plugin-autobackup-settings')
                const username = await guiApi.showInputBox({
                    title: '请输入坚果云邮箱',
                    placeholder: settings.nutstore.username || ""
                })
                if((settings.nutstore.username != "") || ((username != undefined) && (username != ""))){
                    const password = await guiApi.showInputBox({
                        title: '请输入坚果云应用密码',
                        placeholder: settings.nutstore.password || ""
                    })
                    if((settings.nutstore.password != "") || ((password != undefined) && (password != ""))){
                        const imagePath = await guiApi.showInputBox({
                            title: '请输入坚果云备份文件夹',
                            placeholder: settings.nutstore.imagePath || ""
                        })
                        if((settings.nutstore.imagePath != "") || ((imagePath != undefined) && (imagePath != ""))){
                            ctx.saveConfig({
                                'picgo-plugin-autobackup-settings':{
                                    local:{
                                        "imagePath": settings.local.imagePath
                                    },
                                    nutstore:{
                                        'username': username || settings.nutstore.username,
                                        'password': password || settings.nutstore.password,
                                        'imagePath': imagePath || settings.nutstore.imagePath
                                    }
                                }
                            })
                            await guiApi.showMessageBox({
                                title: 'Autobackup',
                                message: '配置完成！',
                                type: 'info',
                                buttons: ['Yes']
                            })
                        }
                        else{
                            await guiApi.showMessageBox({
                                title: 'Autobackup',
                                message: '备份文件夹不能为空！',
                                type: 'error',
                                buttons: ['Yes']
                            })
                        }
                    }
                    else{
                        await guiApi.showMessageBox({
                            title: 'Autobackup',
                            message: '应用密码不能为空！',
                            type: 'error',
                            buttons: ['Yes']
                        })
                    }
                }
                else{
                    await guiApi.showMessageBox({
                        title: 'Autobackup',
                        message: '用户名不能为空！',
                        type: 'error',
                        buttons: ['Yes']
                    })
                }
            }
        }
    ]
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('autobackup加载成功!')

        const userConfig = ctx.getConfig('picgo-plugin-autobackup')
        const settings = ctx.getConfig('picgo-plugin-autobackup-settings')

        // 初始化配置文件
        if(!userConfig){
            ctx.saveConfig({
                'picgo-plugin-autobackup':{
                    space: "Local",
                    markFilepath: "Autobackup/mark.json"
                }
            })
        }
        
        if(!settings){
            ctx.saveConfig({
                'picgo-plugin-autobackup-settings':{
                    local:{
                        imagePath: "Autobackup/Images"
                    },
                    nutstore:{
                        username: "",
                        password: "",
                        imagePath: ""
                    }
                }
            })
        }
        
        // 注册插件
        ctx.helper.beforeUploadPlugins.register('autobackup', {
            handle,
            config: pluginConfig
        })
        ctx.helper.afterUploadPlugins.register('autobackup', afterUploadPlugins)
    }
    return {
        register,
        config: pluginConfig,
        guiMenu,
        beforeUploadPlugins: 'autobackup',
        afterUploadPlugins: 'autobackup'
    }
}