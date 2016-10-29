'use strict'
var mongoose = require('mongoose')
var Video = mongoose.model('Video')
var robot = require('../service/robot') //上传资源到七牛
var config = require('../../config/config')

exports.video = function *(next){
    var body = this.request.body
    var videoData = body.video
    var user = this.session.user
    //判断上传七牛的视频是否成功
    if(!videoData || !videoData.key){
        this.body = {
            success: false,
            err: '视频没有上传成功！'
        }
        return next
    }
    //去数据库查询下是否有该视频
    var video = yield Video.findOne({
        qiniu_key: videoData.key
    }).exec()
    //然后将该视频保存到数据库
    if(!video){
        video = new Video({
            author: user._id,
            qiniu_key: videoData.key,
            persistentId: videoData.persistentId
        })
        video = yield video.save()
    }
    /**
     * 将返回上传到七牛的视频异步上传到cloudinary
     * （云存储cloudinary可以将静音视频和音频合并起来）
     */
    var url = config.qiniu.video + video.qiniu_key
    robot
        .uploadToCloudinary(url)
        .then(function(data){
            if(data && data.public_id){
                video.public_id = data.public_id
                video.detail = data

                video.save()
            }
        })

    this.body = {
        success: true,
        data: video._id
    }

}
