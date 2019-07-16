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