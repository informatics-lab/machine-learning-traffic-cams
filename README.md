# Scraping Images from traffic cam URL to do ML.

A [Node.js](https://nodejs.org/en/) [script](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/src/index.js) to scrape traffic cam images from [Exelis’ Helios Weather Platform](https://helios.earth/explore/login)'s open data API and stream it on an [AWS S3](https://aws.amazon.com/fr/documentation/s3/) bucket.

Weather forecast are linked to each images using [datapoint-js](https://github.com/jacobtomlinson/datapoint-js) and pipe to a [DynamoDB](https://aws.amazon.com/fr/documentation/dynamodb/) table.

To process the images and to do some machine learning, I use [TensorFlow](https://www.tensorflow.org/versions/r0.10/get_started/os_setup.html) and the [jupyter notebook](http://jupyter.org/).
Have a look at the [CADL](https://github.com/pkmital/CADL) project! I found it very helpful to begin with ML in python.

# Keys

__Disclaimer: Note that environmental variables need to be set up:__

[AWS API key](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/get-aws-keys.html)

[HELIOS API key](https://helios.earth/developers/api/session/)

[DATAPOINT API key](http://www.metoffice.gov.uk/datapoint)

So you need account on all of those platforms.

Personally, I put all those keys in a file with other recurring data: [credentials.sh](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/credentials.sh). Obviously you have to fill the file with your own keys. Don't forget to run it before running the main code ([src/index.js](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/src/index.js)):

```Bash
$ . ./credentials.sh
```

# Installation

You need to install some modules _([package.json](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/package.json))_.

Just write the following command line in your terminal:

```Bash
$ npm install
```

For more information, it's [here](https://docs.npmjs.com/getting-started/using-a-package.json)!

# Set up before running index.js

## credentials.sh

To do my way, complete the entire [credentials.sh](https://github.com/met-office-lab/machine-learning-traffic-cams/blob/master/credentials.sh) file: the region of your present AWS server, the name of an S3 bucket, the name of a DynamoDB table, the name of your present working csv file.

__ATTENTION: Scraping can take a very long time with a to big csv file. You might want to split it. That way, be aware to save the new file as a csv in the [resources](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources) folder.__

## AWS

You have to create your own [bucket](http://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html) and your own [table](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html) on AWS.

For the DynamoDB table, I chose to use the camera Id as the primary key. I also add a sort key: the time the image as been scrapped. That way, every item is unique.

The name of the images in S3 follows this pattern: cameraId_scrapeTime.jpg.

## index.js

If you want to set up a CronJob, uncomment the lines 270 to 273 (and comment the line 268). See [Documentation](https://github.com/ncb000gt/node-cron) for time settings:

```JavaScript
//        go());

        new CronJob('* * * * * *', function() {
            go()
        }, null, true, 'Europe/London')
    );
```

# How to run index.js

It's using Node.js. So to run it from the main directory, write this command:

```Bash
node src/index.js
```

# ML thanks to CADL

The _[session-1-traffic-cams.ipynb](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources/session-1-traffic-cams.ipynb)_ file is my own version (not entirely completed!) of the session-1.ipynb file of the CADL project.

For this ML tutorial, you will need a set of 100 traffic cam images. A dataset of images is already prepared in the [resources/Images](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources/Images)_ folder.

The other sessions of the [CADL](https://github.com/pkmital/CADL) project are the next step of this ML project.

# To go further ...

## Lambda function

You can avoid to use your own machine for the CronJob by using [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html) service.
It would fix the problem of size of the csv file and allowed you to scrape anytime, anywhere.

## Get data from AWS

The _[get_data.ipynb](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources/get_data.ipynb)_ file let you check the data you've stored on AWS.

## Scrape the URLs

As you've probably noticed, to scrape the traffic cam images, I had to scrape the traffic cam URLs to create the [webcams.csv](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/resources/webcams.csv) file.

To do so, have look at the _[src/scrapingURL](https://github.com/met-office-lab/machine-learning-traffic-cams/tree/master/src/scrapingURL)_ folder. You can run the html file in your browser (I use Firefox). You will see an empty cell aking you "Go?". Wait the scrape to be over and type "YES" to download the csv file. 