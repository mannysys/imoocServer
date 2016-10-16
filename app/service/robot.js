'use strict'

var qiniu = require('qiniu')
var sha1 = require('sha1')
var config = require('../../config/config')

//需要填写你的密钥
qiniu.conf.ACCESS_KEY = config.qiniu.AK
qiniu.conf.SECRET_KEY = config.qiniu.SK

//要上传的空间名称
var bucket = 'gougouavatar'

//构建上传策略函数（就是获取的一个token）给客户端用户上传资源
function uptoken(bucket, key) {
  var putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key)
  
  //上传图片后发送给你一个通知，七牛会回调一个函数，就是你的域名后面函数
//   putPolicy.callbackUrl = 'http://your.domain.com/callback'
//   putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)'

  return putPolicy.token()
}

// 接收客户端key，生成签名算法，返回七牛签名算法
exports.getQiniuToken = function(key) {
    var token = uptoken(bucket, key)

	return token
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
    

}