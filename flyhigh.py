from time import sleep
from random import randint
from selenium import webdriver

def buildQueryURL(fr, to, date):
  url = 'https://www.google.com/flights#flt={fr}.{to}.{date};c:SEK;e:1;s:0;sd:1;t:f;tt:o'
  url = url.format(fr = fr, to = to, date = date)
  return url

def getDriver(url):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  driver = webdriver.Chrome(chrome_options = options)
  driver.get(url)
  return driver

def parseFlights(driver):
  flights = driver.find_elements_by_class_name('gws-flights-results__result-item')
  return [parseLiItem(li) for li in flights]

def parseLiItem(li):
  return {
    'time': li.find_element_by_class_name('gws-flights-results__times').text,
    'price': li.find_element_by_class_name('gws-flights-results__price').text,
    'flight_number': li.get_attribute('data-fp'),
    'seating': li.find_element_by_class_name('gws-flights-results__seating-class-be-non-be').text,
    'meta': li.find_element_by_class_name('gws-flights-results__leg-flight').text
  }

def main():
  url = buildQueryURL('ARN', 'FRA', '2019-02-14')
  print(url)
  driver = getDriver(url)
  flights = parseFlights(driver)
  print(flights)
  driver.quit()

if __name__ == '__main__':
	main()
