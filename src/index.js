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
            choices: ["local"],
            default: userConfig.space || '',
            message: '备份空间不能为空',
            required: true
        },
        {
            name: 'markFilePath',
            type: 'input',
            alias: 'mark文件路径',
            default: userConfig.markFilePath || '',
            message: '请勿选择系统盘路径',
            required: true
        },
        {
            name: 'imagePath',
            type: 'input',
            alias: '备份路径',
            default: userConfig.imagePath || '',
            message: '请勿选择系统盘路径',
            required: true
        }
    ]
    return config
}


const markInfoConstruct = (markName, storeName, url, space) => {
    return {
        'markName': markName,
        'storeName': storeName,
        'url': url,
        'time': Date.now(),
        'space': space
    }
}


/**
 * 在mark.json中标记图片
 * @param {ctx}              ctx
 * @param {mark.json存储位置} markFilePath
 * @param {图片标记名称}      markName 
 * @param {图片存储名称}      storeName 
 * @param {图片外链}          url
 * @param {图片备份位置}      backupLocation
 */
async function markImage(ctx, markFilePath, markName, storeName, url, space){
    fs.readFile(markFilePath, function(err, data){
        if(err){
            ctx.log.error(`[Autobackup]读取mark.json文件时出错`)
        }
        else if(data){
            var markInfo = JSON.parse(data.toString())
            markInfo.push(markInfoConstruct(markName, storeName, url, space))
            fs.writeFileSync(markFilePath, JSON.stringify(markInfo))
        }
    })
}


/**
 * 初始化存储环境
 * @param {mark.json存储路径} markFilePath 
 * @param {图片备份文件夹}    imagePath 
 */
async function InitEnv(markFilePath, imagePath, space){
    if(space == "local"){
        mkdirs(imagePath, function(){})
        fs.readFile(markFilePath, function(err, data){
            if(err){
                if(err.code === "ENOENT"){
                    try{
                        fs.writeFile(markFilePath, '[]', function(err){})
                    }
                    catch(err){
                        ctx.log.error("[Autobackup]mark.json不存在且程序在创建时失败, 请尝试手动创建！")
                    }
                }
                else{
                    ctx.log.error(`[Autobackup]${err}`)
                }
            }
        })
    }
}


/**
 * 备份图片到本地
 * @param {ctx}                     ctx
 * @param {图片备份文件夹}           imagePath 
 * @param {ctx.output数组成员对象}   imgObject 
 */
function backupInLocal(ctx, imagePath, imgObject){
    // 读取图片数据
    var img = imgObject.buffer
    if((!img) && (imgObject.base64Image)){
        img = Buffer.from(imgObject.base64Image, 'base64')
    }

    // 备份图片
    fs.writeFile(`${imagePath}/${imgObject.fileName}`, img, function(err){
        if(err){
            ctx.log.error(`[Autobackup]${err}`)
        }
    })
}


/**
 * 创建多级文件夹
 * @param {文件夹路径} dirname 
 * @param {回调函数} callback 
 */
 function mkdirs(dirname, callback) {  
    fs.exists(dirname, function (exists) {  
        if (exists) {  
            callback();  
        } 
        else {   
            mkdirs(path.dirname(dirname), function () {  
                fs.mkdir(dirname, callback);  
            });  
        }  
    });  
}  


const handle = async (ctx) => {
    // 加载配置文件
    const userConfig = ctx.getConfig('picgo-plugin-autobackup')
    var markFilePath = userConfig.markFilePath                      // mark.json路径
    var imagePath = userConfig.imagePath                            // 图片备份文件夹
    var space = userConfig.space                                    // 存储空间

    if (!userConfig) {
        throw new Error('请配置相关信息!')
    }   
    else{
        // 初始化存储环境
        await InitEnv(markFilePath, imagePath, space)

        // 加载mark.json文件
        // 异步存取mark.json容易造成数据丢失
        

        // 备份图片
        var imgList = ctx.output
        for(var i in imgList){
            try{
                if(space == 'local'){
                    backupInLocal(ctx, imagePath, imgList[i])
                }
                else{}
                await markImage(ctx, markFilePath, imgList[i].fileName, imgList[i].fileName, imgList[i].imgUrl, space)
                ctx.log.log.success(`[Autobackup]图片备份成功(${imgList[i].fileName})`)
            }
            catch(err){
                ctx.log.error(`[Autobackup]图片备份失败:${imgList[i].fileName}`)
            }
        }
    }    
    return ctx
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('autobackup加载成功!')

        // 初始化配置文件
        ctx.saveConfig({
            'picgo-plugin-autobackup':{
                markFilePath: "",
                imagePath: "",
                space: "local"
            }
        })

        // 注册插件
        ctx.helper.beforeUploadPlugins.register('autobackup', {
            handle,
            config: pluginConfig
        })
    }
    return {
        register,
        config: pluginConfig,
        beforeUploadPlugins: 'autobackup'
    }
}