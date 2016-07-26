# _Scraping Images from traffic cam URL_

_A Node.js script to scrape traffic cam images from [Exelis’ Helios Weather Platform](https://helios.earth/explore/login)'s open data API._

__Disclaimer: Note that environmental variables for AWS and HELIOS need to be set.__

## Installation
You need to install some libraries:

```Bash
$ npm install xmlhttprequest
$ npm install btoa
$ npm install asyncawait/async
$ npm install asyncawait/await
$ npm install request
$ npm install babyparse
$ npm install cron
$ npm install bl
$ npm install aws-sdk
```

You will also require an [AWS API key](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/get-aws-keys.html) and a [HELIOS API key](https://helios.earth/developers/api/session/).

## Set up before beginning

In index.js, put the name of your S3 bucket, your username and the csv file version you want (lines 13 to 17):

```JavaScript
const AWS_S3_DETAILS = {
    bucket : 'nameofyourawsbucket',
};
const CSV_FILE = "/Users/username/molab-mysky-image-scraper/resources/webcams1.csv" //Scrape for one cam
```

You should also set up the CronJob (lines 183 to 186). See [Documentation](https://github.com/ncb000gt/node-cron):

```JavaScript
        new CronJob('* * * * * *', function() {
            go()
        }, null, true, 'Europe/London')
    );
```

## Set up your environment

You can put all your keys in a credentials.sh file. Run it like this:

```Bash
. ./credentials.sh
```

## How to run

After cloning this repository, you can run the code with this command:

```Bash
node src/index.js
```
