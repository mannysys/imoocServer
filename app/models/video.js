'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed

//实例建模对象Schema
var VideoSchema = new Schema({
    //作者（谁上传的视频）
    author: {
        type: ObjectId,
        ref: 'User'  //引用User这张表的（就是指向User表关联起来）
    },
    //保存上传七牛的数据
    qiniu_key: String, //存储上传七牛视频的返回的key
    persistentId: String, //转码后一个静音视频id
    qiniu_final_key: String, //转码后一个静音视频key
    qiniu_detail: Mixed,//视频相关详细信息（Mixed表示混合类型数据）

    //保存上传cloudinary的数据
    public_id: String,
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
VideoSchema.pre('save', function(next){
  if(this.isNew){ //如果是老的数据，进行更新下时间
    this.meta.createAt = this.meta.updateAt = Date.now()
  }else{
    this.meta.updateAt = Date.now()
  }
  next()
})

//进行创建建模，第一参数是定义表名，第二参数是建模对象UserSchema
module.exports = mongoose.model('Video', VideoSchema)