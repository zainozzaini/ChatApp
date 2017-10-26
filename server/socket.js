var app = require('express')();
var http = require('http').Server(app);
var webhook = require('http');

var io = require('socket.io')(http, {pingTimeout: 30000});
var options = {
          host: '127.0.0.1',
          port: 8090,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Content-Length': Buffer.byteLength(data)
          }
        };


const responseToClient = (socket,statusCode,responseWhook,callback) => {
  console.log('webhook response - ',responseWhook.type,statusCode);
  
  if(statusCode === 404){
    console.log('unauthorized');
    socket.emit('action',{type:'server/unauthorized'});
    if(responseWhook.data && io.sockets.adapter.sids[socket.id][responseWhook.data.roomId]){
      socket.to(responseWhook.data.roomId).emit('action',responseWhook);
      socket.leave(responseWhook.data.roomId);
      console.log('leave -',responseWhook.data.roomId);
    }
    socket.disconnect();
    return;
  }

  if(statusCode !== 200){
    //do for else 200 and 404 here
    return;
  }
  //this section for status code 200 only
  switch(responseWhook.type){
    case 'server/join':
      socket.join(responseWhook.data.roomId);
      io.to(responseWhook.data.roomId).emit('action',responseWhook);
      console.log('join room - '+responseWhook.data.roomId+' by '+socket.id + '-'+responseWhook.data.username) ;
      break;
    case 'server/leave':
      socket.to(responseWhook.data.roomId).emit('action',responseWhook);
      socket.leave(responseWhook.data.roomId);
      break;
    case 'server/comment':
      console.log(responseWhook);
      callback({messageId:responseWhook.data.message.id});
      socket.to(responseWhook.data.roomId).emit('action',{type:'server/comment',message:responseWhook.data.message});
      break;
    default:
      console.log('unregistered type action - ',responseWhook.type);      
  }
}


io.on('connection', function(socket) {
    
    //client connected
    console.log("Socket connected: " + socket.id);
    //method namespace - post from redux-socket format
  	socket.on('action', (action,callback) => {
      //webhook for handle data and request from client
      var httpreq = webhook.request(options, function (response) {
                        response.setEncoding('utf8');
                        response.on('data', function (chunk) {
                          responseToClient(socket,response.statusCode,JSON.parse(chunk),callback);
                        });
                        response.on('end', function() {
                          // console.log('end');
                        })
                        
                      });
      httpreq.on('error', function(error) {
        // Error handling here
        var msg = 'error on webhook request';
        console.log(error.errno,msg);
        
      });

      httpreq.write(JSON.stringify(action.data));
      httpreq.end();

	});


});

http.listen(3000, function(){
    console.log('Listening on Port 3000');
});