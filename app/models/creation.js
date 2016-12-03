'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed
/*
 * 存储这个静音视频和录音合并的视频
 */
//实例建模对象Schema
var CreationSchema = new Schema({
    //作者（谁上传的视频）
    author: {
        type: ObjectId,
        ref: 'User'  //引用User这张表的（就是指向User表关联起来）
    },
    video: {
        type: ObjectId,
        ref: 'Video'  
    },
    audio: {
        type: ObjectId,
        ref: 'Audio'  
    },
    //保存上传七牛的数据
    qiniu_thumb: String, //存储封面图
    qiniu_video: String, //在七牛上一个资源名字

    cloudinary_thumb: String, //存储cloudinary上
    cloudinary_video: String,  //通过拼接的url地址
    
    //存储这个合并视频加工到一个程度
    finish: {
        type: Number,
        default: 0
    },

    votes: [String], //点赞，存储的是每个用户id
    up: { //点赞数量
      type: Number,
      default: 0
    },
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
CreationSchema.pre('save', function(next){
  if(this.isNew){ //如果是老的数据，进行更新下时间
    this.meta.createAt = this.meta.updateAt = Date.now()
  }else{
    this.meta.updateAt = Date.now()
  }
  next()
})

//进行创建建模，第一参数是定义表名，第二参数是建模对象UserSchema
module.exports = mongoose.model('Creation', CreationSchema)