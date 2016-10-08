'use strict'

var Router = require('koa-router')
var User = require('../app/controllers/user')
var App = require('../app/controllers/app')

module.exports = function(){
    //实例化路由
    var router = new Router({
        prefix: '/api/1'   //定义路由的前缀
    })
    // user控制器
    router.get('/u/signup', User.signup)  //验证用户登录
    router.post('/u/verify', User.verify)  //验证手机验证码
    router.post('/u/update', User.update)  //更新用户资料

    // app控制器
    router.post('/signature', App.signature)  //获取用户加密的签名

    return router
}
