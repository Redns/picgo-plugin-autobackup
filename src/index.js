var fs = require('fs');

/**
 * 在mark.json中标记图片
 * @param {mark.json存储位置} markFilePath
 * @param {图片标记名称} markName 
 * @param {图片存储名称} storeName 
 * @param {图片外链} url
 * @param {图片备份位置} backupLocation
 */
function markImage(markFilePath, markName, storeName, url, backupLocation){
    fs.readFile(markFilePath + '/mark.json', function(err, data){
        if(data){
            var markInfo = data.toString()
            markInfo = JSON.parse(markInfo)
            markInfo.images.push({
                markName: markName,
                storeName: storeName,
                url: url,
                time: Date.now(),
                backupLocation: backupLocation
            })
            fs.writeFile(markFilePath + '/mark.json', JSON.stringify(markInfo), function(err){
                if(err){
                    throw new Error(err)
                }
            })
        }
    })
}


/**
 * 备份图片到本地
 * @param {图片备份文件夹} imagePath 
 * @param {ctx.output数组成员对象} imgObject 
 */
function backupInLocal(imagePath, imgObject){
    var img = imgObject.buffer
    if((!img) && (imgObject.base64Image)){
        img = Buffer.from(imgObject.base64Image, 'base64')
    }
    fs.writeFile(imagePath + '/' + imgObject.filename, img, function(err){
        if(err){
            throw new Error(err)
        }
    })
}


const handle = async (ctx) => {
    const userConfig = ctx.getConfig('autobackup')
    var markFilePath = userConfig.markFilePath          // mark.json存储文件夹
    var imagePath = userConfig.imagePath                // 图片备份文件夹
    var backupLocation = userConfig.backupLocation      // 图片备份位置(本地、坚果云、阿里云……)

    if (!userConfig) {
        throw new Error('请配置相关信息!')
    }   
    else if(userConfig.enable){
        var imgList = ctx.output
        for(var i in imgList){
            try{
                // 备份到本地
                if(backupLocation == 'local'){
                    backupInLocal(imagePath, imgList[i])
                    markImage(markFilePath, imgList[i].fileName, imgList[i].filename, imgList[i].imgUrl, backupLocation)
                }
            }
            catch(err){
            }
        }
    }    
    return ctx
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('autobackup加载成功!')
        if(!ctx.getConfig('autobackup')){
            ctx.saveConfig({
                'autobackup': {
                    enable: true,
                    markFilePath: '',
                    imagePath: 'Image',
                    backupLocation: 'local'
                }
            })
            fs.mkdir('Image', function(err){
                if(err){
                    throw new Error(err)
                }
            })
            fs.writeFile('mark.json', '{\"images\":[]}', function(err){
                if(err){
                    throw new Error(err)
                }
            })
        }
        
        ctx.helper.afterUploadPlugins.register('autobackup', {
        handle: handle,
        name: 'autobackup'
        })
    }
    return {
        register,
        afterUploadPlugins: 'autobackup'
    }
}