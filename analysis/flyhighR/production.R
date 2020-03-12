library(DBI)
library(lubridate)
library(tidyverse)
library(ggthemes)

plotIt <- FALSE


########################################################################
# Load data from database
########################################################################

# connect to the database
conn <- dbConnect(drv = RSQLite::SQLite(),
                  dbname = file.path("..", "..", "db", "flights.sqlite"))

# fetch the whole flights table
flights <- dbGetQuery(conn = conn,
                      statement = "select * from flights")

# close DB connection
dbDisconnect(conn = conn)


########################################################################
# Tidy up
########################################################################

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
  mutate(departureHour = hour(departure)) %>%
  mutate(departureWeekday = weekdays(departure))

# change currency to EUR
flights <- flights %>%
  mutate(price = price * 0.0929829)

# plot
if (plotIt) {
  flights %>%
    ggplot(aes(x = timeToDeparture@.Data / (60 * 60 * 24), y = price, group = departure, color = flightId)) +
    geom_line() +
    scale_x_reverse() +
    xlab("Time to departure (days)") + ylab("Price (EUR)") +
    theme_tufte()
  
  # plot for May 30th
  flights %>%
    filter(flightDate == "2019-05-30") %>%
    ggplot(aes(x = timeToDeparture@.Data/(24*60*60), y = price, group = departure, color = flightId)) +
    geom_line() +
    scale_x_reverse() +
    xlab("Time to departure (days)") + ylab("Price (EUR)") +
    theme_tufte()
}


########################################################################
# Prepare dataframe for visual
########################################################################

days <- 30

# only one timepoint per day and only up to today
# filter out some extra flight numbers that occured rarely
flights <- flights %>%
  filter(timeToDepartureRounded <= days(days)) %>%
  filter(!grepl("LH622[79]", flightId))


########################################################################
# Prepare data for the visual
########################################################################

# the ring data
flightsByDayToDep <- flights %>%
  filter(departureMonth %in% c(4, 5, 6)) %>%
  # mutate(timeToDepartureDays = as.numeric(timeToDepartureRounded) / (24*60*60) / 2) %>%
  mutate(timeToDepartureDays = round(2 * as.numeric(timeToDepartureRounded) / (24*60*60)) / 2) %>%
  filter(timeToDepartureDays >= 1) %>%
  select(flightIdUnique, timeToDepartureDays, price, departure, timestamp, timestampRounded)

# get all flights with day 1 info
flightsWith1 <- flightsByDayToDep %>%
  filter(timeToDepartureDays == 1) %>%
  select(flightIdUnique) %>%
  unlist() %>%
  unique()

# take only those
flightsFinal <- flightsByDayToDep %>%
  filter(flightIdUnique %in% flightsWith1)

if (plotIt) flightsFinal %>%
  ggplot() +
  geom_line(aes(x = timeToDepartureDays, y = price, group = flightIdUnique)) +
  scale_x_reverse()

write_csv(x = flightsFinal,
          path = file.path("output", "flights_by_day_to_departure.csv"),
          col_names = TRUE,
          quote_escape = "none")


# the flight infos
flightInfo <- flights %>%
  filter(flightIdUnique %in% flightsWith1) %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  group_by(flightIdUnique) %>%
  mutate(medianPrice = median(price, na.rm = TRUE)) %>%
  mutate(meanPrice = mean(price, na.rm = TRUE)) %>%
  mutate(sumPrice = sum(price, na.rm = TRUE)) %>%
  mutate(sdPrice = sd(price, na.rm = TRUE)) %>%
  ungroup() %>%
  filter(timeToDepartureDays == 1) %>%
  select(-starts_with("time"), endPrice = price, -flightDate) %>%
  arrange(departure)

any(duplicated(flightInfo$flightIdUnique))


write_csv(x = flightInfo,
          path = file.path("output", "flight_info.csv"),
          col_names = TRUE,
          quote_escape = "none")
