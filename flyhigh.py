from time import sleep
from selenium import webdriver
from bs4 import BeautifulSoup

def buildQueryURL(fr, to, date, currency):
  url = 'https://www.google.com/flights#flt={fr}.{to}.{date};c:{currency};e:1;s:0;sd:1;t:f;tt:o'
  url = url.format(fr = fr, to = to, date = date, currency = currency)
  return url

def getDriver(url):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  driver = webdriver.Chrome(chrome_options = options)
  driver.get(url)
  sleep(2)
  return driver

def parseFlights(driver):
  def parsePrice(price):
    return int(''.join([i for i in price.split() if i.isdigit()]))

  flightsSoup = BeautifulSoup(driver.page_source, 'lxml')
  for flight in flightsSoup.find_all('li', class_ = 'gws-flights-results__result-item'):
    yield {
      'id': flight['data-fp'],
      'times': flight.find('div', class_ = 'gws-flights-results__times').text,
      'price': parsePrice(flight.find('div', class_ = 'gws-flights-results__price').text)
    }

def main():
  url = buildQueryURL('ARN', 'FRA', '2019-03-14', 'SEK')
  print(url)
  driver = getDriver(url)
  flights = parseFlights(driver)
  print([flight for flight in flights])
  driver.quit()

if __name__ == '__main__':
	main()
