#############
# correlation analysis
#############

# only one timepoint per day and only up to today
flights.forCorr <- flights %>%
  filter(departureRounded < today()) %>%
  filter(!grepl("LH622[79]", flightId))

# mutate
flights.forCorr <- flights.forCorr %>%
  mutate(timeToDepartureDays = floor(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  select(flightIdUnique, timeToDepartureDays, price)

# check for duplicates
allFlights <- unique(flights.forCorr$flightIdUnique)
sum(sapply(X = allFlights,
           FUN = function (flight) {
             flights.forCorr %>%
               filter(flightIdUnique == flight) %>%
               select(timeToDepartureDays) %>%
               unlist() %>%
               duplicated() %>%
               any()
           }))

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
               method = "spearman",
               use = "pairwise.complete.obs")

# replace NAs
cor.mat[is.na(cor.mat)] <- 0

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
summerFlights <- c("LH803_2019_6_8_13_10", "LH809_2019_6_10_6_5", "LH801_2019_6_7_10_0", "LH807_2019_6_7_16_25",
                   "LH803_2019_6_7_13_10", "LH805_2019_6_7_18_50", "LH807_2019_6_9_16_25", "LH801_2019_6_8_10_0",
                   "LH805_2019_6_9_18_50", "LH805_2019_6_8_18_50", "LH807_2019_6_8_16_25", "LH809_2019_6_9_6_20",
                   "LH801_2019_6_10_10_10", "LH803_2019_6_9_13_10", "LH807_2019_4_21_16_25")

flights.forCorr %>%
  filter(flightIdUnique %in% summerFlights) %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique, color = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()

# "standard" flight
flights.forCorr %>%
  filter(flightIdUnique %in% c("LH801_2019_4_2_10_0", "LH801_2019_4_3_10_0", "SK635_2019_4_5_9_0", "LH809_2019_4_3_6_5",
                               "SK635_2019_4_4_9_0", "SK637_2019_4_4_14_35", "SK673_2019_4_4_17_0")) %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique, color = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()

# midsummer flights
flights.forCorr %>%
  filter(grepl("2019_6_2[0-4]", flightIdUnique)) %>%
  ggplot(aes(x = timeToDepartureDays, y = price, group = flightIdUnique, color = flightIdUnique)) +
  geom_line() +
  geom_point() +
  scale_x_reverse()


#############
# correlation analysis with timestamp
#############

# only one timepoint per day and only up to today
flights.forCorr <- flights %>%
  filter(departureRounded < today()) %>%
  filter(!grepl("LH622[79]", flightId))

# mutate
flights.forCorr <- flights.forCorr %>%
  select(flightIdUnique, timestampRounded, price)

# check for duplicates
allFlights <- unique(flights.forCorr$flightIdUnique)
sum(sapply(X = allFlights,
           FUN = function (flight) {
             flights.forCorr %>%
               filter(flightIdUnique == flight) %>%
               select(timestampRounded) %>%
               unlist() %>%
               duplicated() %>%
               any()
           }))

# plot
flights.forCorr %>%
  ggplot(aes(x = as.numeric(timestampRounded), y = price, group = flightIdUnique)) +
  geom_line() +
  scale_x_reverse()

# make a wide table
flights.wide <- flights.forCorr %>%
  spread(key = flightIdUnique, value = price) %>%
  column_to_rownames("timestampRounded")

# calculate the correlation matrix
cor.mat <- cor(flights.wide,
               method = "spearman",
               use = "pairwise.complete.obs")

# replace NAs
cor.mat[is.na(cor.mat)] <- 0

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
            file = file.path("output", "price_correlation_matrix_timestamp.txt"),
            quote = FALSE,
            sep = "\t",
            row.names = TRUE,
            col.names = NA)