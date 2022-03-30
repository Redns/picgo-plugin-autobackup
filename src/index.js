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


/**
 * 获取图片链接
 */
const afterUploadPlugins = {
    handle(ctx){
        // 加载配置文件
        const userConfig = ctx.getConfig('picgo-plugin-autobackup')
        var markFilePath = userConfig.markFilePath                      // mark.json路径
        var imagePath = userConfig.imagePath                            // 图片备份文件夹
        var space = userConfig.space                                    // 存储空间
        
        // 加载mark.json文件
        // 异步存取mark.json容易造成数据丢失
        fs.readFile(markFilePath, function(err, data){
            ctx.log.info(data.toString())
            // 加载 mark.json
            var markInfo =  JSON.parse(data.toString())

            // 备份图片
            var imgList = ctx.output
            for(var i in imgList){
                markInfo.images[parseInt(markInfo.total) + parseInt(i)].url = imgList[i].imgUrl
            }
            markInfo.total = markInfo.total + imgList.length

            // 写入 mark.json
            fs.writeFileSync(markFilePath, JSON.stringify(markInfo))
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
    var markFilePath = userConfig.markFilePath                      // mark.json路径
    var imagePath = userConfig.imagePath                            // 图片备份文件夹
    var space = userConfig.space                                    // 存储空间

    if (!userConfig) {
        throw new Error('请配置相关信息!')
    }   
    else{
        // 初始化存储环境
        mkdirs(imagePath, function(){})

        // 加载mark.json文件
        // 异步存取mark.json容易造成数据丢失
        fs.readFile(markFilePath, function(err, data){
            if(err){
                if(err.code === "ENOENT"){
                    fs.writeFileSync(markFilePath, "{\"total\":0,\"images\":[]}", function(){})
                }
                else{
                    ctx.log.error(`[Autobackup]加载 mark.json 文件失败`)
                }
            }
            else if(data){
                // 加载 mark.json
                var markInfo =  JSON.parse(data.toString())

                // 备份图片
                var imgList = ctx.output
                for(var i in imgList){
                    try{
                        if(space == 'local'){
                            backupInLocal(ctx, imagePath, imgList[i])
                        }
                        else{}
                        markInfo.images.push(markInfoConstruct(imgList[i].fileName, imgList[i].fileName, "", space))
                    }
                    catch(err){
                        ctx.log.error(`[Autobackup]图片备份失败:${imgList[i].fileName}`)
                    }
                }

                // 写入 mark.json
                fs.writeFileSync(markFilePath, JSON.stringify(markInfo))
            }
        })
    }    
    return ctx
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('autobackup加载成功!')

        // 初始化配置文件
        ctx.saveConfig({
            'picgo-plugin-autobackup':{
                markFilePath: "D:/Picgo/Autobackup/mark.json",
                imagePath: "D:/Picgo/Autobackup/Images",
                space: "local"
            }
        })

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
        beforeUploadPlugins: 'autobackup',
        afterUploadPlugins: 'autobackup'
    }
}