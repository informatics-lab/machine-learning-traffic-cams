# Scraping Images from traffic cam URLs to do ML.

__A [Node.js](https://nodejs.org/en/) _[script](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/src/index.js)_ to scrape traffic cam images from [Exelis’ Helios Weather Platform](https://helios.earth/explore/login)'s open data API and stream it to an [AWS S3](https://aws.amazon.com/fr/documentation/s3/) bucket.__

__Weather forecast are linked to each image using [datapoint-js](https://github.com/jacobtomlinson/datapoint-js) and pipe to a [DynamoDB](https://aws.amazon.com/fr/documentation/dynamodb/) table.__

__To process the images and to do some machine learning, I use [TensorFlow](https://www.tensorflow.org/versions/r0.10/get_started/os_setup.html) and the [jupyter notebook](http://jupyter.readthedocs.io/en/latest/install.html).__

__Have a look at the [CADL](https://github.com/pkmital/CADL) project! I found it very helpful to begin with ML in python.__

# Keys

__Disclaimer: Note that the following environmental variables need to be set up:__

[AWS API keys](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/get-aws-keys.html)

[HELIOS API keys](https://helios.earth/developers/api/session/)

[DATAPOINT API keys](http://www.metoffice.gov.uk/datapoint)

So you need account on all of those platforms.

Personally, I put all those keys in a _credentials.sh_ file with other recurring data: 

```Bash
$ #!/usr/bin/env bash

export HELIOS_API_ID =
export HELIOS_API_SECRET =

export DATAPOINT_KEY =

export REGION =
export AWS_ACCESS_KEY =
export AWS_SECRET_ACCESS_KEY =
export BUCKET =
export TABLE =

export CSV_FILE =
```

Obviously you have to fill this file with your own keys.

Don't forget to run it before running the main code (_[src/index.js](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/src/index.js)_):

```Bash
$ . ./credentials.sh
```

# Installation

You need to install some modules (_[package.json](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/package.json)_).

Just type the following command line in your terminal:

```Bash
$ npm install
```

For more information, it's [here](https://docs.npmjs.com/getting-started/using-a-package.json)!

# Set up before running index.js

## credentials.sh

To do my way, create and complete the entire _credentials.sh_ file:
 - The region of your present AWS server
 - The name of the S3 bucket you want the images to be store
 - The name of the DynamoDB table you want all the weather data to be put
 - The name of your present working csv file

There are two csv file: _[webcams.csv](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/resources/webcams.csv)_ and _[webcams1.csv](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/resources/webcams1.csv)_.

The first one contain the URLs, the latitudes and the longitudes for every traffic cameras.

The second one contain only one camera.

Both of them have the same header.

Again, don't forget to set up your environment variables.

__ATTENTION:__

__Scraping on your own machine can take a very long time with the whole cams file. You might want to split it. That way, be aware to save the new file as a csv in the [resources](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources) folder.__

## AWS

You have to create your own [bucket](http://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html) and your own [table](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html) on AWS.

For the DynamoDB table, I chose to use the camera Id as the primary key. I also add a sort key: the time the image as been scrapped. That way, every item is unique.

The name of the images in S3 follows this pattern: cameraId_scrapeTime.jpg.

## index.js

If you want to set up a [cron job](https://en.wikipedia.org/wiki/Cron), uncomment the lines 270 to 273 (and comment the line 268). See [documentation](https://github.com/ncb000gt/node-cron) for time settings:

```JavaScript
//        go());

        new CronJob('* * * * * *', function() {
            go()
        }, null, true, 'Europe/London')
    );
```

# How to run index.js

It's using _Node.js_. So to run it from the main directory, write this command:

```Bash
node src/index.js
```

# ML thanks to CADL

The _[session-1-traffic-cams.ipynb](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/resources/session-1-traffic-cams.ipynb)_ file is my own version (not entirely completed!) of the _[session-1.ipynb](https://github.com/pkmital/CADL/blob/master/session-1/session-1.ipynb)_ file of the [CADL](https://github.com/pkmital/CADL) project.

For this ML tutorial, you will need a set of 100 traffic cam images. A dataset of images is already prepared in the [resources/Images](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/antoine/resources/Images) folder.

The other sessions of the CADL project are the next step of this ML project.

# To go further ...

## Lambda function

You can avoid to use your own machine for the CronJob by using [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html) service.
It would fix the problem of size of the csv file and allowed you to scrape anytime, anywhere.

You can use a command line tool called [kappa](https://github.com/garnaat/kappa). Deploy, update, and test your Lambda functions should be easier.

## Get data from AWS

The *[get_data.ipynb](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/resources/get_data.ipynb)* file let you check the data you've stored on AWS.

It's using [boto3](http://boto3.readthedocs.io/en/latest/).

Choose an existing _cameraId_ and an existing _scrapeTime_ of your DB. The image and the metadata should be display in your notebook. 

## Scrape the URLs

As you've probably noticed, to scrape the traffic cam images, I had to scrape the traffic cam URLs to create the _[webcams.csv](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources/webcams.csv)_ file.

To do so, have look at the [src/scrapingURL](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/antoine/src) folder.

Keys need to be set up in the _[.js file](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/src/scarpingURL/js/scrapingURL.js)_. You can run the _[.html file](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/antoine/src/scarpingURL/html/scrapingURL.html)_ in your browser (I use Firefox). You will see an empty cell aking you " __Go?__ ". Wait the scrape to be over and type " __YES__ " to download the csv file. It would be download with a random name.
