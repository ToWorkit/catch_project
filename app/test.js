/**
 * zookeeper 的方式
 * 实现同一时间段只可以运行同一本的抓取
 */
var zookeeper = require('node-zookeeper-client'),
    tadu = require('../tadu__.js');
 
var client = zookeeper.createClient('localhost:2181');
/*var path = process.argv[2];
console.log(path)*/

var _arguments = process.argv.splice(2);
let path = _arguments[0]
let channel_book_id = _arguments[1]
let book_id = _arguments[2]
// 接收参数
console.log(_arguments)
async function sleep(second) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('sleep')
    }, second)
  })
}

// https://github.com/alexguan/node-zookeeper-client

// 连接
client.once('connected', function () {
  // return null;
    console.log('Connected to the server.');
    // return null;
    // 是否存在节点
    client.exists(path, function (error, stat) {
        if (error) {
            console.log(error.stack);
            return;
        }
        if (stat) {
          console.log('Node exists.');
          // 存在则不执行
          client.close();
        } else {
            console.log('Node does not exist.');
            // 不存在则创建节点
            // EPHEMERAL -> 临时节点
            /*
              持久节点（PERSISTENT）
              持久顺序节点（PERSISTENT_SEQUENTIAL）
              临时节点（EPHEMERAL）
              临时顺序节点（EPHEMERAL_SEQUENTIAL）
             */
            // 操作完成后则释放当前创建的节点
            client.create(path, null, zookeeper.CreateMode.EPHEMERAL, function (error) {
              if (error) {
                  console.log('Failed to create node: %s due to: %s.', path, error);
              } else {
                  console.log('Node: %s is successfully created.', path);
                  // 执行抓书操作
                  (async () => {
                    try {
                      // 塔读的抓书程序
                      await tadu.init(channel_book_id, book_id)
                      // 完成后关闭zookeeper连接释放当前创建的节点
                      client.close();
                    } catch(err) {
                      res.send('err');
                    }
                  })()
              }
          });
        }
    });
});
 
client.connect();
