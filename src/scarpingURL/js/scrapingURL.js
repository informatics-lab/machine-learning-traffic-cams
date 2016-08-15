/*
* Set up your Helios API keys.
*/
const HELIOS_API_KEY = {
    id: YOUR_ID_KEY,
    secret: YOUR_SECRET_KEY,
    pattern: "https://api.exelishelios.com/v1"
};

/*
* Below: Cities where the cams are.
*/
const UK=[
    'Avon',
    'Bedfordshire',
    'Berkshire',
    'Buckinghamshire',
    'Cambridgeshire',
    'Cheshire',
    'Cleveland',
    'Cornwall',
    'Cumbria',
    'Derbyshire',
    'Devon',
    'Dorset',
    'Durham',
    'East Sussex',
    'Essex',
    'Gloucestershire',
    'Hampshire',
    'Herefordshire',
    'Hertfordshire',
    'Isle of Wight',
    'Kent',
    'Lancashire',
    'Leicestershire',
    'Lincolnshire',
    'London',
    'Merseyside',
    'Middlesex',
    'Norfolk',
    'Northamptonshire',
    'Northumberland',
    'North Humberside',
    'North Yorkshire',
    'Nottinghamshire',
    'Oxfordshire',
    'Rutland',
    'Shropshire',
    'Somerset',
    'South Humberside',
    'South Yorkshire',
    'Staffordshire',
    'Suffolk',
    'Surrey',
    'Tyne and Wear',
    'Warwickshire',
    'West Midlands',
    'West Sussex',
    'West Yorkshire',
    'Wiltshire',
    'Worcestershire',
    'England',
    'Northern Ireland',
    'Scotland',
    'Wales'
];

var api_key_id = HELIOS_API_KEY.id;
var api_key_secret = HELIOS_API_KEY.secret;
var api = HELIOS_API_KEY.pattern;
var jwt;
var csv=[];

// Exchange API keys for an OAuth access token
function getToken() {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(evt) {
    jwt = JSON.parse(this.responseText).access_token;
    console.log(jwt);
    getCameras();
    getCamerasPost();
  });
  xhr.open('POST', api + '/oauth/token', true);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(api_key_id + ':' + api_key_secret));
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.withCredentials = true;
  xhr.send('grant_type=client_credentials');
  return csv;
}

// Request some data by including the access token in the Authorization header
function getCameras() {
          
    for(var j=0; j<UK.length ;j++){
        
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(evt) {
        for(var i=0; i<JSON.parse(this.responseText).features.length ;i++){     
            csv.push([JSON.parse(this.responseText).features[i].properties.links.jpeg.url+",",JSON.parse(this.responseText).features[i].geometry.coordinates[1]+",",JSON.parse(this.responseText).features[i].geometry.coordinates[0]]);
            console.log(csv);
        }
            
        });
        xhr.open('GET', api + '/cameras?country=United Kingdom&limit=100&state='+UK[j], true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + jwt);
        xhr.withCredentials = true;
        xhr.send();
    
    }
}

// Request some data by including the access token in a POST body
function getCamerasPost() {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(evt) {
  });
  xhr.open('POST', api + '/cameras/_search', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('access_token=' + jwt);
}

console.log(getToken());

/*
* Create a csv file in your Downloads folder with a random name.
* This csv file contain the URLs, lat and lon for each cams.
*/
putInFile = function(csv){
    var csvContent = "data:text/csv;charset=utf-8,";
    for (var i=0; i<csv.length; i++){
        var infoArray = csv[i];
        var dataString = infoArray.join(" ");
        csvContent += i < csv.length-1 ? dataString+ "\n" : dataString;
    }
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
    return csvContent;
}

/*
* When you run the html fie scrapingURL.html from your browser, you have to wait the scraping to be over.
* Then, write "YES".
* This way, you manage the asynchronous behavior of Node.js.
*/
var go = String(prompt("Go?"));
if(go==="YES"){
    putInFile(csv);
}
else{
    console.log("WAIT");
}