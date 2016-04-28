(ns molab-mysky-image-scraper.core
  (:require [clojure.java.io :as io]
            [clj-http.client :as client]
            [clj-time.core :as time]
            [clj-time.format :as time-format]
            [semantic-csv.core :as sc :refer :all])
  (:gen-class))


(defn blurp [url]
  (let [ba (java.io.ByteArrayOutputStream.)]
    (with-open [src (io/input-stream url)]
      (io/copy src ba))
    (.toByteArray ba)))

(defn blit [bytestream file]
   (with-open [w (java.io.BufferedOutputStream. (java.io.FileOutputStream. file))]
     (.write w bytestream)))

(defn post-image
    [file latitude longitude url]
    (client/post
        "https://iptd1v6we4.execute-api.eu-west-1.amazonaws.com/dev/image"
        {:multipart [
            {:name "dt" :content ((time-format/formatters :basic-date-time) (time/now))}
            {:name "deviceId" :content "image-scraper"}
            {:name "latitude" :content latitude}
            {:name "longitude" :content longitude}
            {:name "image" :content (clojure.java.io/file file)}
            ]
         :headers {"x-api-key" (System/getenv "API_KEY")}
        }
    )
)

(defn scrape-webcam
    [webcam]
    (let [image (blurp (:url webcam))]
          (post-image image (:latitude webcam :longitude webcam))
    )
)

(defn webcams []
    (sc/slurp-csv "webcams.csv"))


(defn -main
  "I don't do a whole lot ... yet."
  [& args]
  () (println "Hello, World!"))