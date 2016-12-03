'use strict'

var mongoose = require('mongoose')
var Comment = mongoose.model('Comment')
var Creation = mongoose.model('Creation')


var userFields = [
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
]
//获取评论内容列表
exports.find = function *(next){
    var id = this.query.creation

    if(!id){
        this.body = {
            success: false,
            err: 'id 不能为空'
        }
        return next
    }
    //执行查询
    var queryArray = [
        Comment.find({
            creation: id
        })
        .populate('replyBy', userFields.join(' '))
        .sort({
            'meta.createAt': -1
        })
        .exec(),
        Comment.count({creation: id}).exec()
    ]
    //执行数组中同时查2条
    var data = yield queryArray

    this.body = {
        success: true,
        data: data[0],
        total: data[1]
    }

}


//保存评论内容
exports.save = function *(next){
    var commentData = this.request.body.comment
    var user = this.session.user
    var creation = yield Creation.findOne({
        _id: commentData.creation
    })
    .exec()
    //检查下视频是否存在
    if(!creation){
        this.body = {
            success: false,
            err: '视频不见了'
        }
        return next
    }

    var comment
    //如果该视频下有评论就查出来，增加新评论内容到数组里
    if(commentData.cid){
        comment = yield Comment.findOne({
            _id: commentData.cid
        })
        .exec()

        var reply = {
            from: commentData.from,
            to: commentData.tid,
            content: commentData.content
        }
        comment.reply.push(reply)
        comment = yield comment.save()

        this.body = {
            success: true
        }
    }else{
        //如果没有评论内容，就插进去一条新的评论数据
        comment = new Comment({
            creation: creation._id,  //视频id
            replyBy: user._id,  //当前用户id（谁对这个视频进行评论的）
            replyTo: creation.author,  //这个视频的作者是谁
            content: commentData.content, //评论内容
            //数组里存储的是两个人之间互相的多次评论
        })
        comment = yield comment.save()
        
        this.body = {
            success: true,
            data: [comment]
        }

    }




}