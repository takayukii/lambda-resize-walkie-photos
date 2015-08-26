var Promise = require('bluebird');
var fs = require('fs');
var im = require('imagemagick');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});

var THUMB_DIR = 'thumbnails/';
var THUMB_WIDTH = 250;
var COVER_DIR = 'covers/';
var COVER_WIDTH = 1000;

exports.handler = function(event, context) {
  // console.log('event', JSON.stringify(event, null, 2));
  // console.log('context', JSON.stringify(context, null, 2));

  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;
  
  console.log('File ' + key + ' was created in ' + bucket);
  
  if(key.match(/thumb/)){
    console.log('It is thumb, so skip..');
    return context.done();
  }
  if(key.match(/cover/)){
    console.log('It is cover, so skip..');
    return context.done();
  }

  var arrivalData = null;
  var contentType = '';
  var extension = '';

  getS3Object({
    Bucket: bucket,
    Key: key,
    IfMatch: event.Records[0].s3.object.eTag
  })
  .then(function (data){
    
    arrivalData = data;
    contentType = arrivalData.ContentType;
    extension = key.split('.').pop();
    
    return imageResize({
      srcData: arrivalData.Body,
      format: extension,
      width: THUMB_WIDTH,
      strip: false
    });

  })
  .then(function (stdout){
    
    var thumbnailKey = key.split('.')[0] + '.' + extension;
    
    return putS3Object({
      Bucket: bucket,
      Key: THUMB_DIR + thumbnailKey,
      Body: new Buffer(stdout, 'binary'),
      ContentType: contentType
    });

  })
  .then(function (res){
    
    return imageResize({
      srcData: arrivalData.Body,
      format: extension,
      width: COVER_WIDTH,
      strip: false
    });

  })
  .then(function (stdout){
    
    var coverKey = key.split('.')[0] + '.' + extension;
    
    return putS3Object({
      Bucket: bucket,
      Key: COVER_DIR + coverKey,
      Body: new Buffer(stdout, 'binary'),
      ContentType: contentType
    });

  })
  .then(function (res){
    console.log('result', JSON.stringify(res, null, 2));
    context.done();
  })
  .catch(function (err){
    console.log('Failed', err);
    context.done('Failed', err);
  });
};

/**
 * {
 *   Bucket: bucket,
 *   Key: key,
 *   IfMatch: event.Records[0].s3.object.eTag
 * }
 **/
function getS3Object(params){
  return new Promise(function (resolve, reject){
    s3.getObject(params, function(err, data) {
      if(err){
        reject(err);
      }else{
        resolve(data);
      }
    });
  });
}

/**
 * {
 *   srcData: data.Body,
 *   format: extension,
 *   width: 256,
 *   strip: false
 * }
 **/
function imageResize(params){
  return new Promise(function (resolve, reject){
    im.resize(params, function(err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * {
 *   Bucket: thumbnailBucket,
 *   Key: 'thumbnails/' + thumbnailKey,
 *   Body: new Buffer(stdout, 'binary'),
 *   ContentType: contentType
 * }
 **/
function putS3Object(params){
  return new Promise(function (resolve, reject){
    s3.putObject(params, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
