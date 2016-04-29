(ns molab-mysky-image-scraper.core
  (:require [clojure.java.io :as io]
    [clj-http.client :as client]
    [clj-time.core :as time]
    [clj-time.format :as time-format]
    [semantic-csv.core :as sc :refer :all]
    [clojure.tools.logging :as log])
  (:gen-class))


(defn blurp
    "Gets a bytestream from a URL object (such as an image)"
    [url]
    (let [ba (java.io.ByteArrayOutputStream.)]
        (with-open [src (io/input-stream url)]
          (io/copy src ba))
        (.toByteArray ba)))

(defn blit
    "Dumps a bystestream to a file"
    [bytestream file]
    (with-open [w (java.io.BufferedOutputStream. (java.io.FileOutputStream. file))]
       (.write w bytestream)))

(defn post-image
    "Posts image and meta-data to the RESTful server"
    [url bytestream lat lon]
    (try
        (client/post
            url
            {:multipart [
                {:name "dt" :content (str (time/now))}
                {:name "deviceId" :content "image-scraper"}
                {:name "latitude" :content lat}
                {:name "longitude" :content lon}
                {:name "image" :content bytestream}
                ]
                :headers {"x-api-key" (System/getenv "API_KEY")}
            }
            )
        (log/info "Post successfull")
    (catch Exception e
        (log/error e "Post failed with:"))
    )
)

(defn scrape-webcam
    "Scrapes a webcam image and posts to the DB"
    [webcam]
    (log/info "Scraping " (:url webcam))
    (let [image (blurp (:url webcam))]
      (post-image (System/getenv "POST_URL") image (:lat webcam) (:lon webcam))
      )
    )

(defn get-webcams
    "Loads list of webcams from our config file"
    []
    (sc/slurp-csv "./resources/webcams.csv"))

(defn scrape-webcams
    "Loops over the webcams scraping them to the database"
    ([webcams]
        (scrape-webcams (first webcams) (rest webcams)))
    ([webcam webcams]
        (scrape-webcam webcam)
        (if (empty? webcams)
            :default
            (recur (first webcams) (rest webcams))
            )
        )
    )

(defn -main
  "Takes a list of urls from webcams.csv, and uploads the images (with the location) to the DynamoDB
  RESTserver is the url of the restful server"
  [& args]
  (scrape-webcams (get-webcams))
  )
