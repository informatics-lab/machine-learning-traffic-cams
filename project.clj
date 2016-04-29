(defproject molab-mysky-image-scraper "0.1.0"
  :description "Script to scrape webcam images and upload to image service"
  :url ""
  :license {:name "GPLv3"
            :url ""}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/tools.logging "0.3.1"]
                 [semantic-csv "0.1.0"]
                 [clj-http "2.1.0"]
                 [clj-time "0.11.0"]]
  :main ^:skip-aot molab-mysky-image-scraper.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
