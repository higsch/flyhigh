#!/usr/bin/env python3

from time import sleep
import datetime

from selenium import webdriver
from bs4 import BeautifulSoup

import sqlite3

DATEFORMAT = '%Y-%m-%d'

def buildQueryURL(fr, to, date, currency):
  url = 'https://www.google.com/flights#flt={fr}.{to}.{date};c:{currency};e:1;s:0;sd:1;t:f;tt:o'
  url = url.format(fr = fr, to = to, date = date, currency = currency)
  return url

def getDriver(url):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  options.add_argument('no-sandbox')
  driver = webdriver.Chrome(chrome_options = options)
  driver.get(url)
  sleep(2)
  return driver

def parseFlights(driver, date):
  def parsePrice(price):
    return int(''.join([i for i in price.split() if i.isdigit()]))
  
  def parseTimes(times, date):
    return [datetime.datetime.strptime(date + '-' + time.strip(), DATEFORMAT + '-%H:%M') for time in times.split('–')]

  flightsSoup = BeautifulSoup(driver.page_source, features = 'html.parser')
  for flight in flightsSoup.find_all('li', class_ = 'gws-flights-results__result-item'):
    times = parseTimes(flight.find('div', class_ = 'gws-flights-results__times').text, date)
    yield {
      'flightId': flight['data-fp'],
      'flightDate': datetime.datetime.strptime(date, DATEFORMAT),
      'departure': times[0],
      'arrival': times[1],
      'duration': flight.find('div', class_ = 'gws-flights-results__duration').text,
      'price': parsePrice(flight.find('div', class_ = 'gws-flights-results__price').text),
      'timestamp': datetime.datetime.now()
    }

def connectDB(dbName):
  db = sqlite3.connect(dbName)
  cur = db.cursor()
  cur.execute('''
    CREATE TABLE IF NOT EXISTS flights(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flightId TEXT,
      flightDate DATETIME,
      departure DATETIME,
      arrival DATETIME,
      duration TEXT,
      price INTEGER,
      timestamp DATETIME)
    ''')
  db.commit()
  return db

def writeFlights(db, flights):
  cur = db.cursor()
  for flight in flights:
    print('Writing to db...\n', flight)
    cur.execute('''
      INSERT INTO flights(flightId, flightDate, departure, arrival, duration, price, timestamp) 
        VALUES(:flightId, :flightDate, :departure, :arrival, :duration, :price, :timestamp)
      ''', flight)
  db.commit()

def main():
  dateRange = ['2019-04-01', '2019-09-30']
  dateRangeDateFormat = [datetime.datetime.strptime(date, DATEFORMAT) for date in dateRange]
  currentDate = dateRangeDateFormat[0]
  while (currentDate <= dateRangeDateFormat[1]):
    date = currentDate.strftime(DATEFORMAT)
    url = buildQueryURL('ARN', 'FRA', date, 'SEK')
    print('Scraping', url)
    driver = getDriver(url)
    flights = parseFlights(driver, date)
    db = connectDB('./db/flights.sqlite')
    with db:
      writeFlights(db, flights)
    driver.quit()
    currentDate += datetime.timedelta(days = 1)

if __name__ == '__main__':
	main()
