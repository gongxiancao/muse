
var connect = require('connect'),
    http = require('http'),
    port;


var app = connect()
    .use(connect.favicon())
    .use(connect.logger('dev'))
    .use(connect.static('public'))
    .use(connect.directory('public'))
    .use(connect.cookieParser())
    .use(connect.session({ secret: 'my secret here' }))
    .use(function(req, res){
        res.end('Hello from Connect!\n');
    });

port = process.env.PORT || 3000;
console.log('Start server with port = ', port);

http.createServer(app).listen(port);