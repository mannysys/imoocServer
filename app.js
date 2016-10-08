'use strict'

//先加载所有模型一遍，初始化模型文件
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var db = 'mongodb://localhost/imooc-app'

mongoose.Promise = require('bluebird') //使用bluebird库做为mongoose内置promise库
mongoose.connect(db) //连接数据库
var models_path = path.join(__dirname, '/app/models')
//遍历读取所有模型文件
var walk = function(modelPath){
  fs
    .readdirSync(modelPath)
    .forEach(function(file){
      var filePath = path.join(modelPath, '/' + file)
      var stat = fs.statSync(filePath)
      //是一个文件或者是js文件
      if(stat.isFile()){
        if(/(.*)\.(js|coffee)/.test(file)){
          require(filePath)
        }
      }else if(stat.isDirectory()){ //如果是目录继续深度遍历
        walk(filePath)
      }
    })
}
walk(models_path)

var koa = require('koa')
var logger = require('koa-logger')
var session = require('koa-session')
var bodyParser = require('koa-bodyparser')
var app = koa()

//设置会话加密字符串
app.keys = ['imooc']  
//加入中间件 
app.use(logger())
app.use(session(app))
app.use(bodyParser())

var router = require('./config/routes')()
app
  .use(router.routes())
  .use(router.allowedMethods())



app.listen(1234)
console.log('Listening: 1234')