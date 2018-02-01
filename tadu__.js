const puppeteer = require('puppeteer');
var child_process = require('child_process');
var fs = require('fs')
let axios = require('axios')
let qs = require('qs')
const mongodb = require('mongodb')
const mongo_url = 'mongodb://127.0.0.1:27017/book'
const mongoClient = mongodb.MongoClient

// 延迟函数
function sleep(second) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(' enough sleep~');
        }, second);
    })
}

/*var _arguments = process.argv.splice(2);
var channel_book_id = `${_arguments[0]}`*/


class Parse {
  constructor() {
    this.page = null
    this.browser = null
    this.bookMessage = {}
  }
  // 接收消费者传入的参数
  async init(channel_book_id, book_id) {
    this._channel_book_id = channel_book_id
    this._book_id = book_id
    this.url = `http://www.tadu.com/book/${channel_book_id}`
    // 浏览器
    this.browser = await puppeteer.launch({
      'headless': true,
    });
    // 页面
    this.page = await this.browser.newPage();
    // 伪装
    const UA = "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36";
    await Promise.all([
        this.page.setUserAgent(UA),
        this.page.setJavaScriptEnabled(true),
        this.page.setViewport({width: 1100, height: 1080}),
    ]);
    await this.getBook()
  }
  async getBook() {
    // 打开指定页面
    await this.page.goto(this.url);
    // css选择器获取元素
    var book_name = await this.page.$eval('#container > div.left > div.bookcover > div > div.book-detail.f-l > h1 > a', el => el.innerText);
    var author_name = await this.page.$eval('#container > div.left > div.bookcover > div > div.book-detail.f-l > ul > li:nth-child(1) > span.mrg > a', el => el.innerText);
    var book_summary = await this.page.$eval('#container > div.left > div.bookcover > div > div.book-detail.f-l > p', el => el.innerText);
    var book_update_time_list = await this.page.$eval('#aboutCatalogue > div.catalog_list_box > div:nth-child(2) > h4', el => el.innerText);
    book_update_time_list = book_update_time_list.split(' ')
    var book_update_time = book_update_time_list[book_update_time_list.length-2].concat(book_update_time_list[book_update_time_list.length-1])
    this.bookMessage = {
      '_id': this._channel_book_id,
      'book_id': this._book_id,
      'channel_book_id': this._channel_book_id,
      'book_name': book_name,
      'book_summary': book_summary,
      'author_name': author_name,
      'book_update_time': book_update_time,
      'chapter_list': [],
    }
    await sleep(1000)
    this.getChapter()
  }
  async getChapter() {
    let chapter_utl = `http://www.tadu.com/book/catalogue/${this._channel_book_id}`
    await this.page.goto(chapter_utl);
    var chapter_list_em = '#container > div.right > div.detail-chapters > ul > li',
        chapter_name_em = 'h5 > a'
    // 执行js
    var book_info = await this.page.evaluate((chapterList_em, chapterName_em)=>{
        return Array.prototype.slice.apply(document.querySelectorAll(chapterList_em)).map((item, key) => {
          const chapter_name = item.querySelector(chapterName_em).innerText
          const chapter_id = item.querySelector(chapterName_em).getAttribute('href').split('/')[3]
          const chapter_order_id = key * 1 + 1
          return {
            chapter_name,
            chapter_id,
            chapter_order_id
          }
        })
    }, chapter_list_em, chapter_name_em);
    this.bookMessage['chapter_list'] = book_info
    let data = await this.bookMessage
    mongoClient.connect(mongo_url, (err, db) => {
      if (err) {
        console.log('连接失败')
      }
      // db.collection('channel_id:2').insert(data,(err, result) => {
      db.collection('tadu_test').insert(data,(err, result) => {
          if(err) {
            console.log('连接失败')
          }
          this.browser.close()
          db.close()
        }
      )
    })
  }  
}

let parse = new Parse()
// parse.init()
module.exports = parse
