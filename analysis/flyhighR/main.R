library(DBI)
library(lubridate)
library(tidyverse)

# connect to the database
conn <- dbConnect(drv = RSQLite::SQLite(),
                  dbname = file.path("data", "flights.sqlite"))

# fetch the whole flights table
flights <- dbGetQuery(conn = conn,
                      statement = "select * from flights")

# convert the dates and times to ms
datetime.cols <- c("flightDate", "departure", "arrival", "timestamp")
datetime.df <- sapply(X = datetime.cols,
                      FUN = function (col) {
                        ymd_hms(flights[[col]],
                                tz = ifelse(col == "timestamp", "UTC", "CET"))
                      },
                      simplify = FALSE,
                      USE.NAMES = TRUE)

flights[, datetime.cols] <- NULL
flights <- cbind(flights, as.data.frame(datetime.df))

# delete entries where timestamp is greater than departure
flights <- flights %>%
  filter(timestamp < departure)

# modify the flightId
flights$flightId <-  gsub(pattern = "ARNFRA0", replacement = "", x = flights$flightId)
  
# calculate time from timestamp until departure and introduce unique character ID
flights <- flights %>%
  mutate(timeToDeparture = as.duration(timestamp %--% departure)) %>%
  mutate(flightIdUnique = paste(flightId, year(departure), month(departure), day(departure), hour(departure), minute(departure), sep = "_"))

# add some information columns for later on
flights <- flights %>%
  mutate(company = substring(flightId, 1, 2)) %>%
  mutate(departureMonth = month(departure)) %>%
  mutate(departureDay = day(departure)) %>%
  mutate(departureHour = hour(departure))

# plot
flights %>%
  ggplot(aes(x = timeToDeparture@.Data, y = price, group = departure, color = flightId)) +
  geom_line() +
  scale_x_reverse()


#############
# correlation analysis
#############

# only one timepoint per day and only up to today
flights.forCorr <- flights %>%
  filter(hour(timestamp) %in% c(22, 23, 0)) %>%
  filter(departure < today()) %>%
  filter(!grepl("LH622[79]", flightId))

# mutate
flights.forCorr <- flights.forCorr %>%
  mutate(timeToDepartureDays = floor(as.numeric(timeToDeparture)/(24*60*60))) %>%
  select(flightIdUnique, timeToDepartureDays, price)

# plot
flights.forCorr %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()

# make a wide table
flights.wide <- flights.forCorr %>%
  spread(key = flightIdUnique, value = price) %>%
  column_to_rownames("timeToDepartureDays")

# calculate the correlation matrix
cor.mat <- cor(flights.wide,
               method = "kendall",
               use = "pairwise.complete.obs")

# hierarchical clustering
hCluster <- hclust(d = dist(cor.mat,
                            method = "euclidean"),
                   method = "average")
cor.mat <- cor.mat[hCluster$order, hCluster$order] %>%
  as.data.frame() %>%
  rownames_to_column("flightIdUnique")

# merge with meta data
cor.mat <- flights %>%
  filter(!duplicated(flightIdUnique)) %>%
  right_join(cor.mat, by = "flightIdUnique")

# export it
write.table(x = cor.mat,
            file = file.path("output", "price_correlation_matrix.txt"),
            quote = FALSE,
            sep = "\t",
            row.names = TRUE,
            col.names = NA)

# plot special flights
summerFlights <- c("LH803_2019_6_8_13_10",	"LH809_2019_6_10_6_5", "LH801_2019_6_7_10_0", "LH807_2019_6_7_16_25",
                   "LH803_2019_6_7_13_10", "LH805_2019_6_7_18_50", "LH807_2019_6_9_16_25", "LH801_2019_6_8_10_0",
                   "LH805_2019_6_9_18_50", "LH805_2019_6_8_18_50", "LH807_2019_6_8_16_25", "LH809_2019_6_9_6_20",
                   "LH801_2019_6_10_10_10", "LH803_2019_6_9_13_10", "LH807_2019_4_21_16_25")

flights.forCorr %>%
  filter(flightIdUnique %in% summerFlights) %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique, color = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()
