//CONSTANTS
const HELIOS_API_KEY = {
    id: process.env.HELIOS_API_ID,
    secret: process.env.HELIOS_API_SECRET
};

const AWS_API_KEY = {
    region : 'eu-west-1',
    accessKeyId : process.env.AWS_ACCESS_KEY,
    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY
};

const AWS_S3_DETAILS = {
    bucket : 'traffic-cam-images-scrape-1',
};

const CSV_FILE = "/Users/antoine/molab-mysky-image-scraper/resources/webcams3.csv"


//DEPENDENCIES AND VARIABLES
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; //can be refactored to use the npm request
var btoa = require('btoa');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var request = require('request');
// request.debug = true;            //use to debug npm request
var Baby = require('babyparse');
var CronJob = require('cron').CronJob;
var bl = require('bl');
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'eu-west-1',
    accessKeyId: AWS_API_KEY.accessKeyId,
    secretAccessKey: AWS_API_KEY.secretAccessKey
});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});




/**
 * Reads in the csv file
 * @returns {Promise} containing each line of the csv as iterable list
 */
var readCSV = function (csvFile) {
    return new Promise(function (resolve, reject) {
        Baby.parseFiles(csvFile, {
            header: true,                       //ignore the first line (labels)
            complete: function (results) {
                console.log("Read csv file : "+csvFile);
                resolve(results);
            },
            error: function (error, file) {
                reject(error);
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
var go = function () {

    var d = new Date();
    console.log('Running at ' + d.toISOString());

    return new Promise(function (resolve, reject) {

        getHeliosToken()
            .then(function (jwt) {

                readCSV(CSV_FILE)
                    .then(function (results) {
                            results.data.forEach(function (camera) {
                                camera['id'] = camera.url.split("/")[5];
                                var filename = camera.id+"_"+d.toISOString()+".jpg";
                                streamToS3(jwt, camera.url, filename)
                                    .then(function () {
                                        console.log("IMAGE: " + camera.url + "streamed");
                                    })
                                    .catch(function (err) {
                                        console.error("Error : " + camera.url);
                                    });

                            });
                            resolve();
                    })
                    .catch(function(err) {
                        console.error("Error reading in csv file :" + CSV_FILE);
                        console.error(err);
                        reject();
                    });

            })
            .catch(function (err) {
                console.error("Error getting helios jwt token");
                reject();
            });
    });
};

/**
 * streams data from source to S3 bucket
 * http://stackoverflow.com/questions/32546904/how-to-stream-file-to-s3-from-url
 *
 * @param jwt
 * @param heliosUrl
 * @param num
 * @returns {Promise}
 */
var streamToS3 = function (jwt, heliosUrl, filename) {
    return new Promise(function(resolve, reject){
        
        var heliosGetRequestOptions = {
            url: heliosUrl,
            headers: {
                'Authorization': 'Bearer ' + jwt
            }
        };

        var callback = function(error, response, body) {
            if(!error) {
                resolve();
            } else {
                reject(error);
            }
        };
        
        request(heliosGetRequestOptions, callback)
            .pipe(bl(function(error, data) {
                    var s3obj = new AWS.S3({params: {Bucket: AWS_S3_DETAILS.bucket + "/" + heliosUrl.split("/")[5]
                                                     , Key: filename}});
                    s3obj.upload({Body: data}).send();
                }));
    });
};

/**
 * gets the jwt access token from helios.
 * @returns {Promise} resolved content is the jwt
 */
var getHeliosToken = function () {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function (evt) {
            var jwt = JSON.parse(this.responseText).access_token;
            console.log("got access token: " + jwt);
            resolve(jwt);
        });

        xhr.open('POST', 'https://api.exelishelios.com/v1/oauth/token', true);
        xhr.setRequestHeader('Authorization', 'Basic ' + encodeHeliosCredentials());
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.withCredentials = true;
        xhr.send('grant_type=client_credentials');
    });
};

/**
 * encodes the helios credentials
 * @returns {*} encoded credentials
 */
var encodeHeliosCredentials = function () {
    return btoa(HELIOS_API_KEY.id + ":" + HELIOS_API_KEY.secret);
};

/**
 * Runs everything...
 */

//go();

async(function () {

    await(
//        go());

        new CronJob('00 * 16,17,18,19 * * 1-5', function() {
            go()
        }, null, true, 'Europe/London')
    );

    return;
})();