'use strict'

var qiniu = require('qiniu')
var cloudinary = require('cloudinary')
var Promise = require('bluebird')
var sha1 = require('sha1')
var uuid = require('uuid')
var config = require('../../config/config')

//需要填写你的密钥
qiniu.conf.ACCESS_KEY = config.qiniu.AK
qiniu.conf.SECRET_KEY = config.qiniu.SK

//配置cloudinary上传参数值
cloudinary.config(config.cloudinary)

// 接收客户端key，生成签名算法，返回七牛签名算法
exports.getQiniuToken = function(body) {
	var type = body.type
	var key = uuid.v4()
	var putPolicy
	var options = {
		persistentNotifyUrl: config.notify
	}
	if(type === 'avatar'){
		//上传图片后发送给你一个通知，七牛会回调一个函数，就是你的域名后面函数
		//   putPolicy.callbackUrl = 'http://your.domain.com/callback'
		//   putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)'
		key += '.jpeg'
		putPolicy = new qiniu.rs.PutPolicy('gougouavatar:' + key) //gougouavatar上传的空间名称
	}
	else if(type === 'video'){
		key += '.mp4'	
		options.scope = 'gougouvideo:' + key
		options.persistentOps = 'avthumb/mp4/an/1'  //上传的视频静音
		putPolicy = new qiniu.rs.PutPolicy2(options)

	}
	else if(type === 'audio'){
		//

	}
	//构建上传策略函数（就是获取的一个token）给客户端用户上传资源
    var token = putPolicy.token()
	return {
		key: key,
		token: token
	}

}

//将七牛返回的视频上传到cloudinary云存储上，进行静音视频和录音音频的合并
exports.uploadToCloudinary = function(url){

	return new Promise(function(resolve, reject){
		cloudinary.uploader.upload(url, function(result){
			if(result && result.public_id){
				resolve(result)
			}else{
				reject(result)
			}
		}, {
			resource_type: 'video',
			folder: 'video'  //指定上传到哪个文件夹下
		})
	})

}

// 生成Cloudinary签名
exports.getCloudinaryToken = function(body) {
	var type = body.type
	var timestamp = body.timestamp
	var folder
	var tags

    if(type === 'avatar'){
		folder = 'avatar'
		tags = 'app,avatar'
	}else if(type === 'video'){
		folder = 'video'
		tags = 'app,video'
	}else if(type === 'audio'){
		folder = 'audio'
		tags = 'app,audio'
	}

    // 生成签名
    var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.cloudinary.api_secret
    signature = sha1(signature)   // sha1加密
	var key = uuid.v4()

	return {
		token: signature,
		key: key
	}

}