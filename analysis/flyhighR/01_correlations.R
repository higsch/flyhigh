#############
# correlation analysis
#############

days <- 60

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

# flights.clust %>%
#   filter(cluster == 1) %>%
#   filter(grepl("LH801", flightIdUnique)) %>%
#   ggplot(aes(x = timeToDeparture@.Data, y = price, group = flightIdUnique, color = flightIdUnique)) +
#   geom_line() +
#   scale_x_reverse()
