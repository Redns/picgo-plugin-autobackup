const { dir } = require('console')
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
 * @param {文件路径}        path 
 * @param {待写入的数组}    buffer 
 * @param {回调函数}        callback 
 */
const writeFileRecursive = function(path, buffer, callback){
    let lastPath = path.substring(0, path.lastIndexOf("/"));
    fs.mkdir(lastPath, {recursive: true}, (err) => {
        if (err) return callback(err);
        fs.writeFile(path, buffer, function(err){
            if (err) return callback(err);
            return callback(null);
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
    writeFileRecursive(`${imagePath}/${imgObject.fileName}`, Buffer.from(img), (err)=>{
        if(err) ctx.log.error(`[Autobackup]本地备份失败，${err.message}`);
    });
}


/**
 * 创建多级文件夹
 * @param {文件夹路径}      dirname 
 * @param {回调函数}        callback 
 */
 function mkdirs(dirname, callback) {  
    let lastPath = dirname.substring(0, dirname.lastIndexOf("/"));
    fs.mkdir(lastPath, {recursive: true}, (err) => {
        if (err) return callback(err);
    });
}  


/**
 * 获取图片链接
 */
const afterUploadPlugins = {
    handle(ctx){
        // 加载配置文件
        const userConfig = ctx.getConfig('picgo-plugin-autobackup')
        const settings = ctx.getConfig('picgo-plugin-autobackup-settings')                
        

        /**
         * 加载mark.json文件
         */
        fs.readFile(userConfig.markFilepath, function(err, data){
            if(err){
                if(err.code === "ENOENT"){
                    fs.writeFileSync(userConfig.markFilepath, "{\"total\":0,\"images\":[]}", function(){})
                }
                else{
                    ctx.log.error(`[Autobackup]加载 mark.json 文件失败`)
                }
            }
            else if(data){
                // 加载标记文件
                var markInfo =  JSON.parse(data.toString())

                // 修改标记文件
                var imgList = ctx.output
                for(var i in imgList){
                    if(userConfig.space == "Local"){
                        backupInLocal(ctx, settings.local.imagePath, imgList[i])
                        markInfo.images.push(markInfoConstruct("Local", `${settings.local.imagePath}/${imgList[i].fileName}`, imgList[i].imgUrl))
                    }
                    else if(userConfig.space == "NutStore"){
                        // 备份至坚果云
                        const NutStoreUploadRequest = NutStoreUploadConstruct(settings.nutstore.imagePath, imgList[i], settings.nutstore.username, settings.nutstore.password)
                        ctx.Request.request(NutStoreUploadRequest, function (error, response) {
                            if(error){
                                ctx.log.error(`[Autobackup]图片上传至坚果云失败，备份路径为：${imagePath}/${imageObject.fileName}`)
                            }
                        })
                        markInfo.images.push(markInfoConstruct("NutStore", `${settings.nutstore.imagePath}/${imgList[i].fileName}`, imgList[i].imgUrl))
                    }

                    if(imgList[i].bufferCopy != undefined){
                        delete imgList[i].bufferCopy
                    }
                    if(imgList[i].base64ImageCopy != undefined){
                        delete imgList[i].base64ImageCopy
                    }
                }
                markInfo.total = markInfo.total + imgList.length

                // 写入标记文件
                fs.writeFileSync(userConfig.markFilepath, JSON.stringify(markInfo))
            }
        })
    }
}


/**
 * 构建坚果云上传文件请求
 * @param {图片备份文件夹}      imagePath 
 * @param {图片上传数组对象}    imageObject 
 * @param {坚果云用户名}        username 
 * @param {坚果云应用密码}      password 
 * @returns 
 */
const NutStoreUploadConstruct = (imagePath, imageObject, username, password) => {
    // 读取图片数据
    var img = imageObject.bufferCopy
    if((!img) && (imageObject.base64ImageCopy)){
        img = Buffer.from(imageObject.base64ImageCopy, 'base64')
    }

    return {
        'method': 'PUT',
        'url': `https://dav.jianguoyun.com/dav/${imagePath}/${imageObject.fileName}`,
        'headers': {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`, 'utf-8').toString('base64')}`,
          'Content-Type': `image/${imageObject.extname.substring(1)}`
        },
        body: img
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
                ctx.log.error(`[Autobackup]图片${imgList[i].fileName}数组拷贝失败:${err.message}`)
            }
        }
    }    
    return ctx
}


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
                else if(settings.local.imagePath == ""){
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