/**
 * node 执行命令行操作 cmd
 * @type {[type]}
 */
var process = require('child_process');

process.exec('node test.js \/tadu_01_01 532068 786',function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log(stdout)
    console.log(stderr)
});
