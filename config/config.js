'use strict'
/**
 * 参数配置
 */
module.exports = {
    
    qiniu: {
        // video: 'ofuein66v.bkt.clouddn.com', 
        video: 'http://ohl9unxcs.qnssl.com/', //上传到七牛云存储视频的url地址
        AK: 'U-BRnY1MoXvJ4m4NX0_hrEoHKkAQSS7OIuHKGerm',
        SK: 'HkxTPHJ7y8dC2f3be8M4dDRSBT78GWquVdkfRrL5'
    },
    // 云存储cloudinary上传的数据的参数值
    cloudinary: {
        cloud_name: 'dk7g9s6hq',
        api_key: '273449438826248',
        api_secret: 'PMq1QRZx9h_vpbG-KGq_Ic70awI',
        base: 'http://res.cloudinary.com/dk7g9s6hq',
        image: 'https://api.cloudinary.com/v1_1/dk7g9s6hq/image/upload', //图片上传地址
        video: 'https://api.cloudinary.com/v1_1/dk7g9s6hq/video/upload', //视频上传地址
        audio: 'https://api.cloudinary.com/v1_1/dk7g9s6hq/audio/upload'  //音频上传地址
    }

}
