// https://github.com/denghongcai/node-framebuffer.git  의 fork 버


var framebuffer = require('./lib/framebuffer');
var fb = new framebuffer('/dev/fb0');

var express = require('express');
var path = require('path');
var robot = require('robotjs');

var PNG = require('pngjs').PNG;
var fs = require('fs');
var async = require('async');


var app = express();
var server = app.listen( process.env.port || 55555, function(){
    console.log('This server is running on the port ' + this.address().port );
});


var io = require('socket.io').listen(server);
app.use( express.static( path.join(__dirname, 'public') ));

var fb_tmp = fb.buffer();

var start, finish;

var png = new PNG({
    width: 1024,
    height: 768,
    filterType: -1,
    deflateLevel: 3,
    deflateStrategy: 1,
    checkCRC : false
});


io.sockets.on('connection', function(socket){

    socket.on('publish', function(){
        //console.log('publish');
        start = new Date();
        for(var y =0; y<png.height; y++){
            for(var x=0; x<png.width; x++){
                var idx = (png.width*y +x)<<2 ;
                var temp_idx = (png.width*y +x)*3;
                png.data[idx] = fb_tmp[temp_idx+2];
                png.data[idx+1] = fb_tmp[temp_idx+1];
                png.data[idx+2] = fb_tmp[temp_idx];
                png.data[idx+3] = 0xff;
            }
        }
        finish = new Date();
        //console.log("Operation took " + (finish.getTime() - start.getTime()) + " ms");

        start = new Date();
        var stream = png.pack().pipe( fs.createWriteStream( path.join(__dirname,'public','bg.png') ) );

        stream.on('finish', function(){
            socket.emit('canvas');
            finish = new Date();
            //console.log("Operation took " + (finish.getTime() - start.getTime()) + " ms");
        })

    });

    /*
     0 = The left mouse button<br>
     1 = The middle mouse button<br>
     2 = The right mouse button
    * */
    socket.on('mouseClick', function(pos){
        robot.moveMouse(pos.x, pos.y);

        switch(pos.button){
            case 0: robot.mouseToggle('down', 'left');
                    break;

            case 1: robot.mouseToggle('down', 'middle');
                    break;
            case 2: robot.mouseToggle('down', 'right');
                    break;

        }

    });

    socket.on('mouseRelease', function(pos){
        robot.moveMouse(pos.x, pos.y);

        switch(pos.button){
            case 0: robot.mouseToggle('up', 'left');
                break;

            case 1: robot.mouseToggle('up', 'middle');
                break;
            case 2: robot.mouseToggle('up', 'right');
                break;
        }
    });

    socket.on('mouseMove', function(pos){
        robot.moveMouse(pos.x, pos.y);
    });

    socket.on('keyboard', function(key){
        robot.keyTap('a');
    });

});

//fb.close();
