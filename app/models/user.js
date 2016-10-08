'use strict'

var mongoose = require('mongoose')

//实例建模对象Schema
var UserSchema = new mongoose.Schema({
    phoneNumber: {  //手机号码
      unique: true, //唯一性
      type: String
    },
    areaCode: String,    //手机区号
    verifyCode: String,  //验证码
    accessToken: String, //判定用户合法性，是否注册和登录过
    nickname: String,
    gender: String,
    breed: String,
    age: String,
    avatar: String,
    meta: {
      createAt: { //创建时间
        type: Date,
        default: Date.now()
      },
      updateAt: { //更新时间
        type: Date,
        default: Date.now()
      }
    }

})

//在存储前，可以加个回调函数处理
UserSchema.pre('save', function(next){
  if(this.isNew){ //如果是老的数据，进行更新下时间
    this.meta.createAt = this.meta.updateAt = Date.now()
  }else{
    this.meta.updateAt = Date.now()
  }
  next()
})

//进行创建建模，第一参数是定义表名，第二参数是建模对象UserSchema
module.exports = mongoose.model('User', UserSchema)