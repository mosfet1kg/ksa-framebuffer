var fs = require('fs');
var imagemin = require('image-min');
var path = require('path');

var src = fs.createReadStream(path.join(__dirname,'bg.png' ));
var ext = path.extname(src.path);

src
    .pipe(imagemin({ ext: ext }))
    .pipe(fs.createWriteStream(path.join(__dirname,'img-minified' + ext)));