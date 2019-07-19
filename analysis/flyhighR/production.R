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
  mutate(departureHour = hour(departure)) %>%
  mutate(departureWeekday = weekdays(departure))

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

#############
# correlation analysis
#############

days <- 30

# flights with 50 days of followup
selectedFlights <- flights %>%
  filter(departure < today()) %>%
  group_by(flightIdUnique) %>%
  summarise(maxTimeToDepartureRounded = max(timeToDepartureRounded),
            minTimeToDepartureRounded = min(timeToDepartureRounded)) %>%
  filter(maxTimeToDepartureRounded >= days(days)) %>%
  filter(minTimeToDepartureRounded <= hours(25)) %>%
  select(flightIdUnique) %>%
  unlist() %>%
  unique()

# only one timepoint per day and only up to today
flights.forCorr <- flights %>%
  filter(flightIdUnique %in% selectedFlights) %>%
  filter(timeToDepartureRounded <= days(days)) %>%
  filter(!grepl("LH622[79]", flightId))

# mutate
flights.forCorr.filt <- flights.forCorr %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  select(flightIdUnique, timeToDepartureDays, price)

# check for duplicates
allFlights <- unique(flights.forCorr.filt$flightIdUnique)
dups <- sapply(X = allFlights,
               FUN = function (flight) {
                 flights.forCorr.filt %>%
                   filter(flightIdUnique == flight) %>%
                   select(timeToDepartureDays) %>%
                   unlist() %>%
                   duplicated() %>%
                   any()
               })
any(dups)
# flights.forCorr.filt %>%
#   filter(flightIdUnique %in% names(dups[dups == TRUE])) %>%
#   View()

# plot
flights.forCorr.filt %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()

# make a wide table
flights.wide <- flights.forCorr.filt %>%
  spread(key = flightIdUnique, value = price) %>%
  column_to_rownames("timeToDepartureDays")

# calculate the correlation matrix
cor.mat <- cor(flights.wide,
               method = "pearson",
               use = "pairwise.complete.obs")

# replace NAs
sum(is.na(cor.mat))
cor.mat[is.na(cor.mat)] <- 0

# hierarchical clustering
hCluster <- hclust(d = dist(cor.mat,
                            method = "euclidean"),
                   method = "average")
plot(hCluster)

labels <- cutree(tree = hCluster, k = 10)
cluster.df <- data.frame(flightIdUnique = names(labels),
                         cluster = labels,
                         stringsAsFactors = FALSE)

cor.df <- cor.mat[hCluster$order, hCluster$order] %>%
  as.data.frame() %>%
  rownames_to_column("flightIdUnique") %>%
  left_join(cluster.df, by = "flightIdUnique") %>%
  left_join(flights %>% filter(!duplicated(flightIdUnique)), by = "flightIdUnique") %>%
  select(matches("^[^LS]"), everything())

# export it
write.table(x = cor.df,
            file = file.path("output", "price_correlation_matrix.txt"),
            quote = FALSE,
            sep = "\t",
            row.names = TRUE,
            col.names = NA)

# plot cluster-wise
flights.clust <- flights.forCorr %>%
  left_join(cluster.df, by = "flightIdUnique")

flights.clust %>%
  ggplot(aes(x = timeToDeparture@.Data, y = price, group = flightIdUnique, color = flightId)) +
  geom_line() +
  scale_x_reverse() +
  facet_wrap(~ cluster)


# the ring data
flightsByDayToDep <- flights.clust %>%
  filter(departureMonth %in% c(5, 6, 7)) %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  filter(timeToDepartureDays >= 1) %>%
  select(flightIdUnique, timeToDepartureDays, price, departure)

# get all flights with day 1 info
flightsWith1 <- flightsByDayToDep %>%
  filter(timeToDepartureDays == 1) %>%
  select(flightIdUnique) %>%
  unlist() %>%
  unique()

# take onlz those
flightsFinal <- flightsByDayToDep %>%
  filter(flightIdUnique %in% flightsWith1)

flightsFinal %>%
  ggplot() +
  geom_line(aes(x = timeToDepartureDays, y = price, group = flightIdUnique)) +
  scale_x_reverse()

write_csv(x = flightsFinal,
          path = file.path("output", "flights_by_day_to_departure.csv"),
          col_names = TRUE,
          quote_escape = "none")


# the flight infos
flightInfo <- flights.clust %>%
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
