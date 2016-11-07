'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed

//实例建模对象Schema
var AudioSchema = new Schema({
    //作者（谁上传的视频）
    author: {
        type: ObjectId,
        ref: 'User'  //引用User这张表的（就是指向User表关联起来）
    },

    video: {
        type: ObjectId,
        ref: 'Video'  //引用Video这张表的（就是指向Video表关联起来）每个音频配音指向这个视频video
    },
    
    qiniu_video: String,
    qiniu_thumb: String,

    public_id: String, //保存上传cloudinary的数据
    detail: Mixed,

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
AudioSchema.pre('save', function(next){
  if(this.isNew){ //如果是老的数据，进行更新下时间
    this.meta.createAt = this.meta.updateAt = Date.now()
  }else{
    this.meta.updateAt = Date.now()
  }
  next()
})

//进行创建建模，第一参数是定义表名，第二参数是建模对象UserSchema
module.exports = mongoose.model('Audio', AudioSchema)