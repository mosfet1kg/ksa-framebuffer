'use strict';

var fs = require('fs');
var ioctl = require('ioctl');
var constants = require('./constants');
var structs = require('./structs');
var mmap = require('mmap-io');


var framebuffer = function(dev) {
  this.dev = dev;
  this.fbfd = fs.openSync(dev, 'r+')  ;

  var vinfo = new structs.Vinfo(); // vinfo struct
  var ret = ioctl(this.fbfd, constants.FBIOGET_VSCREENINFO, vinfo.ref());
  if(ret !== 0) {
    console.error('IOCTL ERROR');
  }
  this.xres = vinfo.xres;
  this.yres = vinfo.yres;
  this.xoffset = vinfo.xoffset;
  this.yoffset = vinfo.yoffset;
  this.bytes_per_pixel = vinfo.bits_per_pixel / 8;
  this.bits_per_pixel = vinfo.bits_per_pixel;
  this.grayscale = vinfo.grayscale;
  this.red = vinfo.red;
  this.green = vinfo.green;
  this.blue = vinfo.blue;
  this.transp = vinfo.transp;
  this.nonstd = vinfo.nonstd;

  var finfo = new structs.Finfo();
  ret = ioctl(this.fbfd, constants.FBIOGET_FSCREENINFO, finfo.ref());
  if(ret !== 0) {
    console.error('IOCTL ERROR');
  }
  this.name = finfo.id.buffer.toString('ascii');
  this.type = finfo.type;
  this.visual = finfo.visual;
  this.line_length = finfo.line_length;

  this.screensize = vinfo.xres * vinfo.yres ;
  console.log('xres:', vinfo.xres, 'yres:', vinfo.yres, 'bytes_per_pixel:' ,this.bytes_per_pixel);


  this.rx_prot = mmap.PROT_READ | mmap.PROT_WRITE;
  this.priv = mmap.MAP_SHARED;
  this.fbp = mmap.map(this.screensize * this.bytes_per_pixel, this.rx_prot, this.priv, this.fbfd);

};

framebuffer.prototype.getScreenSize = function(){
  return this.screensize;
};

framebuffer.prototype.getRx_prot = function(){
  return this.rx_prot;
};
framebuffer.prototype.getPriv = function(){
  return this.priv;
};

framebuffer.prototype.buffer = function(){
  return this.fbp;
};

framebuffer.prototype.close = function() {
  fs.closeSync(this.fbfd);
  this.fbp.unmap();
};

framebuffer.prototype.blank = function(blank) {
  var ret;
  if(blank) {
    ret = ioctl(this.fbfd, constants.FBIOBLANK, constants.FB_BLANK_POWERDOWN);
    if(ret !== 0) {
      console.error('IOCTL ERROR');
    }
  }
  else {
    ret = ioctl(this.fbfd, constants.FBIOBLANK, constants.FB_BLANK_UNBLANK);
    if(ret !== 0) {
      console.error('IOCTL ERROR');
    }
  }
};

framebuffer.prototype.fileDescriptor = function(){
  return this.fbfd;
};

framebuffer.prototype.toString = function() {
  return 'Framebuffer device information:\n' +
      ' Device: ' + this.dev + '\n' +
      ' Name: ' + this.name + '\n' +
      ' Size: ' + this.screensize + '\n' +
      ' Type: ' + this.type + '\n';
};

module.exports = framebuffer;

