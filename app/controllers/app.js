'use strict'
var mongoose = require('mongoose')
var User = mongoose.model('User')


exports.signature = function *(next){
    this.body = {
        success: true
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