'use strict'
var mongoose = require('mongoose')
var Promise = require('bluebird')
var Video = mongoose.model('Video')
var Audio = mongoose.model('Audio')
var Creation = mongoose.model('Creation')
var xss = require('xss')
var robot = require('../service/robot') //上传资源到七牛
var config = require('../../config/config')


var userFields = [
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
]
//视频列表页
exports.find = function *(next){
    var page = parseInt(this.query.page, 10) || 1  //第几页
    var count = 5   //每页显示数量
    var offset = (page - 1) * count
    var queryArray = [
        Creation
            .find({finish: 100})
            .sort({
                'meta.createAt': -1
            })
            .skip(offset)
            .limit(count)
            .populate('author', userFields.join(' '))  //关联指定表和要查询字段
            .exec(),
        Creation.count({finish: 100}).exec()
    ]
    //执行数组中2条查询语句
    var data = yield queryArray

    this.body = {
        success: true,
        data: data[0],
        total: data[1]
    }

}


function asyncMedia(videoId, audioId){
    if(!videoId) return
    var query = {
        _id: audioId
    }
    if(!audioId){
        query = {
            video: videoId
        }
    }

    //数据模型内置了Promise，可以使用Promise来查询,同时查询
    Promise.all([
        Video.findOne({_id: videoId}).exec(),
        Audio.findOne(query).exec()
    ])
    .then(function(data){
        var video = data[0]
        var audio = data[1]

        //检查从cloudinary上传的视频和音频返回的值
        if(!video || !video.public_id || !audio || !audio.public_id){
            return
        }
        //将cloudinary返回来的视频名字中/斜线替换下划线_ 后缀加上.mp4
        var video_public_id = video.public_id
        var audio_public_id = audio.public_id.replace(/\//g, ':')
        var videoName = video_public_id.replace(/\//g, '_') + '.mp4'
        
        //通过url规则参数，拼接成访问地址
        var videoURL = 'http://res.cloudinary.com/dk7g9s6hq/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + video_public_id + '.mp4'

        //拿到视频封面图名字
        var thumbName = video_public_id.replace(/\//g, '_') + '.jpg'
        //拿到封面图地址
        var thumbURL = 'http://res.cloudinary.com/dk7g9s6hq/video/upload/' + video_public_id + '.jpg'

        //将视频上传到七牛云存储
        robot
            .saveToQiniu(videoURL, videoName)
            .catch(function(err){
                console.log(err)
            })
            .then(function(response){
                if(response && response.key){
                    audio.qiniu_video = response.key
                    audio.save().then(function(_audio){
                        Creation.findOne({
                            video: video._id,
                            audio: audio._id
                        }).exec()
                        .then(function(_creation){
                            if(_creation){
                                if(!_creation.qiniu_video){
                                    _creation.qiniu_video = _audio.qiniu_video
                                    _creation.save()
                                }
                            }
                        })
                        console.log(_audio)
                        console.log('同步视频成功')
                    })
                }
            })
        //封面图片也同步上传到七牛
        robot
            .saveToQiniu(thumbURL, thumbName)
            .catch(function(err){
                console.log(err)
            })
            .then(function(response){
                if(response && response.key){
                    audio.qiniu_thumb = response.key
                    audio.save().then(function(_audio){
                        Creation.findOne({
                            video: video._id,
                            audio: audio._id
                        }).exec()
                        .then(function(_creation){
                            if(_creation){
                                if(!_creation.qiniu_video){
                                    _creation.qiniu_thumb = _audio.qiniu_thumb
                                    _creation.save()
                                }
                            }
                        })
                        console.log(_audio)
                        console.log('同步封面成功')
                    })
                }
            })

    })



    

}

//保存audio音频到数据库
exports.audio = function *(next){
    var body = this.request.body
    var audioData = body.audio
    var videoId = body.videoId
    var user = this.session.user

    if(!audioData || !audioData.public_id){
        this.body = {
            success: false,
            err: '音频没有上传成功！'
        }
        return next
    }
    //检查接收的这个的音频和视频，数据库里是否存在
    var audio = yield Audio.findOne({
        public_id: audioData.public_id
    })
    .exec()
    var video = yield Video.findOne({
        _id: videoId
    })
    .exec()
    //如果没有这个音频，就创建一个对象
    if(!audio){
        var _audio = {
            author: user._id,
            public_id: audioData.public_id,
            detail: audioData
        }
        //如果有这个视频存在，就在对象里加入一个video的id值
        if(video){
            _audio.video = video._id
        }
        audio = new Audio(_audio) //通过new创建一个音频的数据对像，传入_audio对象
        audio = yield audio.save()  //保存这个对象数据到数据库中
    }

    //异步操作，处理将保存到数据库后的音频和视频进行合并
    asyncMedia(video._id, audio._id)

    this.body = {
        success: true,
        data: audio._id
    }

}



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
    // var url = config.qiniu.video + video.qiniu_key
    var url = config.qiniu.video + video.qiniu_key

    robot
        .uploadToCloudinary(url)
        .then(function(data){
            if(data && data.public_id){
                video.public_id = data.public_id
                video.detail = data

                video.save().then(function(_video){
                    asyncMedia(_video._id )
                })
            }
        })
        .catch((err) => {
            console.log(err)
        })

    this.body = {
        success: true,
        data: video._id
    }

}

//保存音频和视频合并后的发布视频数据
exports.save = function *(next){
    var body = this.request.body
    var videoId = body.videoId
    var audioId = body.audioId
    var title = body.title
    var user = this.session.user
   
    //查询数据库视频和音频是否存在
    var video = yield Video.findOne({
        _id: videoId
    }).exec()
    var audio = yield Audio.findOne({
        _id: audioId
    }).exec()

    if(!video || !audio){
        this.body = {
            success: false,
            err: '音频或者视频素材不能为空'
        }

        return next
    }
    //查看之前有没有存储，数据是否重复
    var creation = yield Creation.findOne({
        audio: audioId,
        video: videoId
    }).exec()

    if(!creation){
        var creationData = {
            author: user._id,
            title: xss(title),
            audio: audioId,
            video: videoId,
            finish: 20
        }

        var video_public_id = video.public_id  //拿到在cloudinary上存储资源名字
        var audio_public_id = audio.public_id  //拿到在audio资源名字

        if(video_public_id && audio_public_id){
            //拿到封面图和视频地址
            creationData.cloudinary_thumb = 'http://res.cloudinary.com/dk7g9s6hq/video/upload/' + video_public_id + '.jpg'
            creationData.cloudinary_video = 'http://res.cloudinary.com/dk7g9s6hq/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id.replace(/\//g,':') + '/' + video_public_id + '.mp4'  
            creationData.finish += 20
        }

        if(audio.qiniu_thumb){
            creationData.qiniu_thumb = audio.qiniu_thumb
            creationData.finish += 30
        }
        if(audio.qiniu_video){
            creationData.qiniu_video = audio.qiniu_video
            creationData.finish += 30
        }

        creation = new Creation(creationData)
    }
    //保存到数据库
    creation = yield creation.save()

    this.body = {
        success: true,
        data: {
            _id: creation._id,
            finish: creation.finish,
            title: creation.title,
            qiniu_thumb: creation.qiniu_thumb,
            qiniu_video: creation.qiniu_video,
            author: {
                avatar: user.avatar,
                nickname: user.nickname,
                gender: user.gender,
                breed: user.breed,
                _id: user._id
            }
        }
    }


}