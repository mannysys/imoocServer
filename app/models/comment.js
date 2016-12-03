'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed

//实例建模对象Schema
var CommentSchema = new Schema({
    //指定关联视频表的 _id
    creation: {
        type: ObjectId,
        ref: 'Creation'
    },
    content: String,  //评论内容
    //写评论用户
    replyBy: {
        type: ObjectId,
        ref: 'User'  //引用User这张表的（就是指向User表关联起来）
    },
    //评论给一个用户（评论给谁的）
    replyTo: {
        type: ObjectId,
        ref: 'User'  
    },
    //多个评论
    reply: [{
        from: {type: ObjectId, ref: 'User'}, //来自于谁的评论
        to: {type: ObjectId, ref: 'User'}, 
        content: String
    }],

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
CommentSchema.pre('save', function(next){
  if(this.isNew){ //如果是老的数据，进行更新下时间
    this.meta.createAt = this.meta.updateAt = Date.now()
  }else{
    this.meta.updateAt = Date.now()
  }
  next()
})

//进行创建建模，第一参数是定义表名，第二参数是建模对象UserSchema
module.exports = mongoose.model('Comment', CommentSchema)