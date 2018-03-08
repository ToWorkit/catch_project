const puppeteer = require('puppeteer');
var child_process = require('child_process');
var fs = require('fs')
let axios = require('axios')
let qs = require('qs')
const mongodb = require('mongodb')
const mongo_url = 'mongodb://127.0.0.1:27017/book'
const mongoClient = mongodb.MongoClient
function sleep(second) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(' enough sleep~');
        }, second);
    })
}

/*
  详细注释请参考 puppeteer进阶_抓取书旗 的代码  
*/

class Parse {
  constructor() {
    this.page = null
    this.browser = null
    this.bookMessage = {}
  }
  async init(channel_book_id) {
    this._channel_book_id = channel_book_id
    // 书籍url
    this.url = `http://t.shuqi.com/route.php?pagename=route.php#!/ct/cover/bid/${channel_book_id}`
    this.browser = await puppeteer.launch({
      'headless': true,
    });
    this.page = await this.browser.newPage();
    // 基础配置
    const UA = "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36";
    await Promise.all([
        this.page.setUserAgent(UA),
        this.page.setJavaScriptEnabled(true),
        this.page.setViewport({width: 1100, height: 1080}),
    ]);
    await this.getBook()
  }
  async getBook() {
    await this.page.goto(this.url);
    let page = await this.page
    // 拦截 ajax
    page.on('requestfinished', request => {
      if (request.resourceType == "xhr") {
        if(request.url.indexOf('http://walden1.shuqireader.com/webapi/book/info') != -1) {
          (async () => {
            let res = await request.response();
            let result = await res.json();
            let res_data = result.data           
            this.bookMessage = {              
              '_id': res_data.bookId,                          
              'channel_book_id': res_data.bookId,              
              'book_name': res_data.bookName,              
              'book_summary': res_data.desc,              
              'author_name': res_data.cpName,              
            }
            await sleep(1000)
            let data = await this.bookMessage
            // 连接mongo 并存储数据
            mongoClient.connect(mongo_url, (err, db) => {                
                db.collection('channel_id:37').insert(data,(err, result) => {
                    if(err) {
                      console.log('连接失败')
                    }
                    this.browser.close()                   
                    db.close()
                  }
                )
              })
          })()
        }
      }
    });
  }
}

let parse = new Parse()
module.exports = parse
// parse.init()
