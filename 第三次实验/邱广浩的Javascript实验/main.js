var greet = require('./hello');
greet('Michael');
var fs = require('fs');
var http = require('http');
var url = require('url');
var path = require('path');
var root = path.resolve('.');
var data = fs.readFileSync('sample.txt', 'utf-8');
console.log(data);
fs.readFile('sample.txt', 'utf-8', function (err, data) {
    console.log(data);
});
var server = http.createServer(function (request, response) {
    var pathname = url.parse(request.url).pathname;
    var filepath = path.join(root, pathname);
    fs.stat(filepath, function (err, stats) {
        if (!err && stats.isFile()) {
            response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            fs.createReadStream(filepath).pipe(response);
        } else if (pathname === '/') {
            response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            response.end('<h1>Hello Node.js</h1>');
        } else {
            response.writeHead(404);
            response.end('404 Not Found');
        }
    });
});
server.listen(12399);
console.log('Server is running at http://127.0.0.1:12399/');