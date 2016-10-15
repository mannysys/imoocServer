'use strict'
var xss = require('xss')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var uuid = require('uuid')
var sms = require('../service/sms')

exports.signup = function *(next){
    var phoneNumber = xss(this.request.body.phoneNumber.trim())
    /**
     * 查询接收的手机号码，在数据库中是否存在，如果没有该手机号
     * 先对手机号xss过滤然后存储到数据库中
     * 如果有该手机号存在，就更新该手机号码验证码
     */
    var user = yield User.findOne({
        phoneNumber: phoneNumber
    }).exec()

    var verifyCode = sms.getCode() //拿到生成的随机验证码
    if(!user){
      var accessToken = uuid.v4()
      user = new User({
        nickname: '小狗宝', //默认给个昵称
        avatar: 'http://tva2.sinaimg.cn/crop.0.232.440.440.180/7837dbb0jw8f1xci1c0loj20c80lqgno.jpg', //默认头像地址
        phoneNumber: xss(phoneNumber), 
        verifyCode: verifyCode,  //短信验证码
        accessToken: accessToken //用户token 作为用户票据
      })
    }else{
      user.verifyCode = verifyCode  
    }
    
    try{
      user = yield user.save() //保存用户数据
    }catch(e){
      this.body = {
        success: false
      }
      return next
    }
    //发送短信的内容
    var msg = '您的注册验证码是：' + user.verifyCode
    try{
      //开始发送短信验证码
      sms.send(user.phoneNumber, msg)
    }catch(e){
      console.log(e)

      this.body = {
        success: false,
        err: '短信服务异常'
      }
      return next
    }

    this.body = {
      success: true
    }
    
}

//验证用户验证码
exports.verify = function *(next){
  //接收用户提交验证码和电话号码
  var verifyCode = this.request.body.verifyCode
  var phoneNumber = this.request.body.phoneNumber

  if(!verifyCode || !phoneNumber){
    this.body = {
      success: false,
      err: '验证未通过'
    }
    return next  //如果追加了中间件可以处理对于返回数据的封装
  }

  //去查找数据库里是否存有手机号和验证码
  var user = yield User.findOne({
    phoneNumber: phoneNumber,
    verifyCode: verifyCode
  }).exec() //调用exec方法

  if(user){
    user.verified = true  //表示用户的验证码验证过了
    user = yield user.save() //保存数据

    //返回给客户端数据
    this.body = {
      success: true,
      data: {
        nickname: user.nickname,
        accessToken: user.accessToken,
        avatar: user.avatar,
        _id: user._id
      }
    }
  }else{
    this.body = {
      success: false,
      err: '验证未通过'
    }
  }

  
}

//更新用户资料
exports.update = function *(next){
  var body = this.request.body
  var user = this.session.user

  //转换成数组
  var fields = 'avatar,gender,age,nickname,breed'.split(',')
  fields.forEach(function(field){
    //如果接收到body里含有更新的字段的话，就将新字段值赋值给user对象
    if(body[field]){
      user[field] = xss(body[field].trim())  //使用xss过滤非法字符，去掉前后空格
    }
  })
  user = yield user.save()

  //返回数据
  this.body = {
    success: true,
    data: {
      nickname: user.nickname,
      accessToken: user.accessToken,
      avatar: user.avatar,
      age: user.age,
      breed: user.breed,
      gender: user.gender,
      _id: user._id
    }
  }


}