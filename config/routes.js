'use strict'

var Router = require('koa-router')
var User = require('../app/controllers/user')
var App = require('../app/controllers/app')
var Creation = require('../app/controllers/creation')
var Comment = require('../app/controllers/comment')

module.exports = function(){
    //实例化路由
    var router = new Router({
        prefix: '/api'   //定义路由的前缀
    })
    // user控制器
    router.post('/u/signup', App.hasBody, User.signup)  //验证用户登录
    router.post('/u/verify', App.hasBody, User.verify)  //验证手机验证码
    router.post('/u/update', App.hasBody, App.hasToken, User.update)  //更新用户资料

    // app控制器
    router.post('/signature', App.hasBody, App.hasToken, App.signature)  //获取用户加密的签名
    
    // creations
    router.get('/creations', App.hasToken, Creation.find) 
    router.post('/creations', App.hasBody, App.hasToken, Creation.save) 
    router.post('/creations/video', App.hasBody, App.hasToken, Creation.video) 
    router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio) 

    // comments  get是获取评论列表 post是评论存储
    router.get('/comments', App.hasToken, Comment.find) 
    router.post('/comments', App.hasBody, App.hasToken, Comment.save) 

    //点赞 votes
    router.post('/up', App.hasBody, App.hasToken, Creation.up) 

    return router
    
}
