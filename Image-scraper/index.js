//DEPENDENCIES AND VARIABLES
var async = require('async');
//var each = require('async-each-series');
var fs = require('fs');
var parse = require('csv-parse');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; //CAN BE AVOID
//var http = require('http');
var btoa = require('btoa');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var request = require('request');
var Baby = require('babyparse');
var CronJob = require('cron').CronJob;
var AWS = require('aws-sdk');
var AWS4 = require('aws4');
AWS.config.region = 'eu-west-1';
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

var d = new Date();

var apiKey = {
    id: process.env.API_ID,
    secret: process.env.API_SECRET
};

//API STUFF
var encodeCredentials = function() {
    return btoa(apiKey.id+":"+apiKey.secret);
};

//READ WEBCAMS.CSV
var readCSV = function() {        
    return new Promise(function(resolve, reject) {
        Baby.parseFiles('webcams.csv', {
            header: true,
            complete: function(results) {
                resolve(results);
            }
        });
    })
};

/*
*MAIN FUNCTION
*THE GO FUNCTION CALLS GETTOKEN
*THEN WITH THE TOKEN IT CALLS THE GETAUTHORISEDCALL FOR EACH URLS OF THE CSV FILE
*ALL THE IMAGES ARE IN THE FOLDER IMAGES
*/
var go = function() {
    
    console.log('DATE BEGINNING: '+d.getDate()+'/'+(d.getMonth()+1)+'_'+d.getHours()+'h'+d.getMinutes()+'m'+d.getSeconds()+'s');

    return new Promise(function (resolve, reject) {
    console.log("getting access token.");
    getToken()
        .then(
            function(jwt) {
                
                readCSV().then(
                    function(results){
                        
                        var i = 0;
                        results.data.forEach(function(camera){
                                
                            getAuthorisedCall(jwt, camera.url, i++)
                                .then(
                                    function(response){
                                        console.log("IMAGE: "+ camera.url +"downloaded.");
                                    }).catch(
                                    function(err){
                                        console.log("ERROR GETTING IMAGE : "+camera.url);
                                    });
                        });
                    }
                );               
            })
        .catch(
            function(err){
                console.log("ERROR GETTING TOKEN!!!!");
                reject();
            });
        });
};

var awsObject = {
    key: process.env.AWS_ACCESS_KEY,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: 'informatics-scraping-images-v2'
};

/*
*FUNCTION TO GET THE AUTHORISATION THANKS TO THE TOKEN
*SAVE THE IMAGES IN THE IMAGES FOLDER 
*/
var getAuthorisedCall = function(jwt, url, num) {
    
    console.log('Making auth request to url:\n'+url)
    return new Promise(function(resolve,reject) {
        
    var getReqOptions = {
        url : url,
        headers : {
            'Authorization' : 'Bearer ' + jwt
        }
    };
        
    var awsPutOptions = {
        url: 'https://console.aws.amazon.com/s3/home?region=eu-west-1&bucket=informatics-scraping-images-v2&prefix=',
        method: 'PUT',
        awsConfigRegion: 'eu-west-1',
        awsConfigAccessKeyId: process.env.AWS_ACCESS_KEY,
        awsConfigSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
        
//    function upload(cb) {
//       var s3 = new AWS.S3(...);
//       var stream = request.get(url);
//       stream.on('error', cb)
//             .on('close', cb);
//       var params = {Bucket: 'bucket', Key: 'key', Body: stream};
//       var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
//       s3.upload(params, options, cb);
//    }
        
//        var callback = function(error,response,body) {
//            if(!error) {
        
        
    var toAwsS3 = function(url) {                   
        var s3obj = new AWS.S3();
        var stream = request.get(url);
        
        var params = {
            Bucket: 'informatics-scraping-images-v2', 
            Key: 'img_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getHours()+'_'+d.getMinutes()+'_'+d.getSeconds()+'_'+num+'.jpg',
            Body: stream
        };
        
        s3obj.upload(params, function(err, data) {
                if (err){       
                    console.log(err);
                    reject();
                }
                else {
                    console.log('Successfully uploaded data to informatics-scraping-images-v2/img_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getHours()+'_'+d.getMinutes()+'_'+d.getSeconds()+'_'+num+'.jpg');
                    resolve();
                }
            });
    }
    request(getReqOptions).pipe(request.put();
                              
//                s3obj.upload(params,)
//                .on('httpData', function(evt) { 
//                    console.log(evt); })
//                .on('httpDone', function(evt) { 
//                    console.log("uploaded to s3");
//                    resolve();
//            }
//            else {
//                reject();
//            }
//        }
        
//        request(options, callback).createReadStream().on('images/img_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getHours()+'_'+d.getMinutes()+'_'+d.getSeconds()+'_'+num+'.jpg', function(data){
//            console.log('Got image: ', data.toString());
//        });
        
//        request(options, callback).pipe(fs.createWriteStream(
//            'images/img_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getHours()+'_'+d.getMinutes()+'_'+d.getSeconds()+'_'+num+'.jpg'));   
    });
};

//FUNCTION TO GET THE TOKEN
var getToken = function() {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(evt) {
            var jwt = JSON.parse(this.responseText).access_token;
            console.log("got access token: "+ jwt);
            resolve(jwt);
        });

        xhr.open('POST', 'https://api.exelishelios.com/v1/oauth/token', true);
        xhr.setRequestHeader('Authorization', 'Basic ' + encodeCredentials());
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.withCredentials = true;
        xhr.send('grant_type=client_credentials');
    });
};

//ARRAY OF THE SCRAPING HOURS
//var sampleHours = [15, 16];

/*
*RUN THE MAIN
*AVOID ASYNCHONOUS PROBLEMS
*RUN DEPENDING ON THE CRONTAB
*/
async( function() {
    await(
/*
*SCRAPING THE IMAGES
*GET THE IMAGES ON THE FOLDER IMAGES
*GET THE IMAGES ON THE S3 BUCKET ON AWS
*/
        
//        new CronJob('00,10,20,30,40,50 * '+sampleHours[0]+','+sampleHours[1]+' * * 1-5', function() {
//        new CronJob((d.getMinutes()+1)+' * * * 1-5', function() {
            go());

//        },
//        function(){
//            console.log("--------------------");
//            console.log("END");
//        },
//        true, 'Europe/London'));

    return;
})();