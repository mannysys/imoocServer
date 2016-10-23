'use strict'
var mongoose = require('mongoose')
var uuid = require('uuid')
var User = mongoose.model('User')
var robot = require('../service/robot') //上传资源到七牛

/**
 * 服务端支持2种图片上传图床（七牛和cloudinary）
 * post请求过来，我们接收type和timestamp值，
 * 然后进行配置，返回给客户端加密的签名值
 */
exports.signature = function *(next){
	var body = this.request.body
    var cloud = body.cloud
	var token
    var key

    //如果传过来的是qiniu，就是上传到七牛的请求，生成七牛的签名算法
    if(cloud === 'qiniu'){
        var data = robot.getQiniuToken(body)
        token = data.token
        key = data.key
    }
    else{
        token = robot.getCloudinaryToken(body) //请求是cloud，就是生成该签名算法
    }
    this.body = {
        success: true,
        data: {
            token: token,
            key: key
        }
    }


}

/**
 * 中间件 检查请求的接口里body数据是否有携带数据
 */
exports.hasBody = function *(next){
    var body = this.request.body || {}

    //检查对象中是否有key
    if(Object.keys(body).length === 0){
        this.body = {
            success: false,
            err: '是不是漏掉什么了'
        }
        return next
    }

    yield next

}

/**
 * 中间件 检查请求accessToken参数
 */
exports.hasToken = function *(next){
    var accessToken = this.query.accessToken
    //如果从get请求获取不到，就从post请求获取
    if(!accessToken){
        accessToken = this.request.body.accessToken
    }
    if(!accessToken){
        this.body = {
            success: false,
            err: '钥匙丢了'
        }
        return next
    }

    //如果接收到了accessToken，查询数据库
    var user = yield User.findOne({
        accessToken: accessToken
    }).exec()

    if(!user){
        this.body = ({
            success: false,
            err: '用户没有登陆'
        })
        return next
    }
    
    //如果当前session没有的话，给个对象再讲user存储到session
    this.session = this.session || {}
    this.session.user = user

    yield next

}