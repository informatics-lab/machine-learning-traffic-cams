(ns molab-mysky-image-scraper.core-test
  (:require [clojure.test :refer :all]
            [molab-mysky-image-scraper.core :refer :all]
            [clojure.java.io :as io]))

(deftest a-good-test
  (testing "FIXME, I fail."
    (is (= 1 1))))

(deftest test-scrape-webcam
  (testing "Downloading webcam image"
    (blit (blurp "https://www.millerstewart.com/webcams/ArranFerry/arranFerry.jpg") "/tmp/testfile.jpg")
    (is (.exists (io/as-file "/tmp/testfile.jpg")))
))

(deftest test-post-image)
