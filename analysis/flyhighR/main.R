library(DBI)
library(lubridate)
library(tidyverse)

plotIt <- FALSE

# connect to the database
conn <- dbConnect(drv = RSQLite::SQLite(),
                  dbname = file.path("data", "flights.sqlite"))

# fetch the whole flights table
flights <- dbGetQuery(conn = conn,
                      statement = "select * from flights")

# close DB connection
dbDisconnect(conn = conn)

# convert the dates and times to ms
datetime.cols <- c("flightDate", "departure", "arrival", "timestamp")
datetime.df <- sapply(X = datetime.cols,
                      FUN = function (col) {
                        ymd_hms(flights[[col]],
                                tz = ifelse(col == "timestamp", "UTC", "Europe/Stockholm"))
                      },
                      simplify = FALSE,
                      USE.NAMES = TRUE)

flights[, datetime.cols] <- NULL
flights <- cbind(flights, as.data.frame(datetime.df))

# transform everything to UTC time
flights <- flights %>%
  mutate(departure = with_tz(time = departure, tzone = "UTC")) %>%
  mutate(arrival = with_tz(time = arrival, tzone = "UTC"))

# delete entries where timestamp is greater than departure
flights <- flights %>%
  filter(timestamp < departure)

# modify the flightId
flights$flightId <-  gsub(pattern = "ARNFRA0", replacement = "", x = flights$flightId)

# round timestamp and departure to halfdays
roundHalfDay <- function (daytime) {
  days <- round_date(daytime, unit = "days")
  hours <- round_date(daytime, unit = "hour") %>% hour()
  midnight <- hours %in% c(22, 23, 0, 1)
  days[!midnight] <- days[!midnight] + dhours(12)
  return(days)
}

flights <- flights %>%
  mutate(timestampRounded = roundHalfDay(timestamp)) %>%
  mutate(departureRounded = roundHalfDay(departure)) %>%
  mutate(daynight = ifelse(hour(timestampRounded) == 12, 'day', 'night'))

# calculate time from timestamp until departure and introduce unique character ID
flights <- flights %>%
  mutate(timeToDeparture = as.duration(timestamp %--% departure)) %>%
  mutate(timeToDepartureRounded = as.duration(timestampRounded %--% departureRounded)) %>%
  mutate(flightIdUnique = paste(flightId, year(departure), month(departure), day(departure), hour(departure), minute(departure), sep = "_"))

# add some information columns for later on
flights <- flights %>%
  mutate(company = substring(flightId, 1, 2)) %>%
  mutate(departureMonth = month(departure)) %>%
  mutate(departureDay = day(departure)) %>%
  mutate(departureHour = hour(departure))

# plot
if (plotIt) {
  flights %>%
    ggplot(aes(x = timeToDeparture@.Data, y = price, group = departure, color = flightId)) +
    geom_line() +
    scale_x_reverse()
  
  # plot for August 30th
  flights %>%
    filter(flightDate == "2019-08-30") %>%
    ggplot(aes(x = timeToDeparture@.Data/(24*60*60), y = price, group = departure, color = flightId)) +
    geom_line() +
    scale_x_reverse() 
}
