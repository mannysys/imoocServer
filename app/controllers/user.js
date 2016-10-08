'use strict'
var xss = require('xss')
var mongoose = require('mongoose')
var User = mongoose.model('User')


exports.signup = function *(next){
    // var phoneNumber = this.request.body.phoneNumber
    var phoneNumber = this.query.phoneNumber
    /**
     * 查询接收的手机号码，在数据库中是否存在，如果没有该手机号
     * 先对手机号xss过滤然后存储到数据库中
     * 如果有该手机号存在，就更新该手机号码验证码
     */
    var user = yield User.findOne({
        phoneNumber: phoneNumber
    }).exec()
    if(!user){
      user = new User({
        phoneNumber: xss(phoneNumber) 
      })
    }else{
      user.verifyCode = '1212'  
    }
    
    try{
      user = yield user.save() //保存新的数据
    }catch(e){
      this.body = {
        success: false
      }
      return
    }

    this.body = {
      success: true
    }
}

exports.verify = function *(next){
    this.body = {
        success: true
    }
}

exports.update = function *(next){
    this.body = {
        success: true
    }
}