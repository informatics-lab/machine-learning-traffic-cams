//CONSTANTS
const HELIOS_API_KEY = {
    id: process.env.HELIOS_API_ID,
    secret: process.env.HELIOS_API_SECRET
};

const AWS_API_KEY = {
    region : process.env.REGION,
    accessKeyId : process.env.AWS_ACCESS_KEY,
    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY
};

const AWS_S3_DETAILS = {
    bucket : process.env.BUCKET,
};

const DATAPOINT_KEY = process.env.DATAPOINT_KEY

const CSV_FILE = process.env.CSV_FILE


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

var datapoint = require('datapoint-js')
    datapoint.set_key(DATAPOINT_KEY)
    
/**
 * Return metadata about the streamed image
 */
var weatherHere = function(camId, date, lat, lon){
    var site = datapoint.get_nearest_forecast_site(lon, lat);
    var forecast = datapoint.get_forecast_for_site(site.id, "3hourly");
    var now = forecast.days[0].timesteps[0];
    
    var metadata = {
        "cameraId" : camId,
        "scrapeTime" : date.toISOString(),
        "info" : {
            "site" : site.name,
            "weather" : now.weather.text,
            "temperature" : now.temperature.value+"°"+now.temperature.units
        } 
    }
        
    return metadata;
}

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

/**
 *MAIN FUNCTION
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
                                        console.error("Error: " + camera.url);
                                    });
                                
                                updateToDB(jwt, camera.url, camera.id, d, camera.lat, camera.lon)
                                    .then(function(){
                                        console.log("Metadata of the image: " + filename + " updated");
                                    })
                                    .catch(function(err){
                                        console.error("Error: " + weatherHere(camera.id, d, camera.lat, camera.lon));
                                    })

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
                    var s3obj = new AWS.S3({params: {Bucket: AWS_S3_DETAILS.bucket
/**
* If you uncomment the line 169, the images will be store on S3 by camera, on specific folder.
*/
                                                     
//                                                     + "/" + heliosUrl.split("/")[5]
                                                     , Key: filename}});
                    s3obj.upload({Body: data}).send();
                }));
    });
};

/**
 * streams item from source to DynamoDB table
 *
 * @param jwt
 * @param heliosUrl
 * @param camId
 * @param d
 * @param lat
 * @param lon
 * @returns {Promise}
 */
var updateToDB = function (jwt, heliosUrl, camId, d, lat, lon) {
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
        
        var params = {
            TableName : process.env.TABLE,
            Item : {
                "cameraId" : camId,
                "scrapeTime" : d.toISOString(),
                "site" : weatherHere(camId, d, lat, lon).info.site,
                "weather" : weatherHere(camId, d, lat, lon).info.weather,
                "temperature" : weatherHere(camId, d, lat, lon).info.temperature
            }
        };
        
        var docClient = new AWS.DynamoDB.DocumentClient();
        
        console.log("Importing metadata into DynamoDB. Please wait.");
        
        request(heliosGetRequestOptions, callback)
            .pipe(bl(function(error, data) {
                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to add " + heliosUrl + ". Error JSON:" + JSON.stringify(err, null, 2));
                    } else {
                        console.log("PutItem succeeded:" + heliosUrl);
                    }
                });
        
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
async(function () {
    await(
        go());

//        new CronJob('* * * * * *', function() {
//            go()
//        }, null, true, 'Europe/London')
//    );

})();