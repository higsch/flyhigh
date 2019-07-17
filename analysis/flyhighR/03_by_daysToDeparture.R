library(fmsb)

data <- flights.clust %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  filter(timeToDepartureDays >= 1) %>%
  select(flightIdUnique, timeToDepartureDays, price) %>%
  spread(key = flightIdUnique, value = price) %>%
  column_to_rownames("timeToDepartureDays")

endPrices <- data[1, ] %>% as.numeric()
names(endPrices) <- colnames(data)
sum(is.na(endPrices))
max(endPrices, na.rm = TRUE)

data.norm <- apply(X = data,
                   MARGIN = 1,
                   FUN = function (row) {
                     (row / endPrices)
                   }) %>%
  as.data.frame()

# normalised
# data.final <- rbind(rep(4, ncol(data.norm)), rep(0, ncol(data.norm)), data.norm)
# radarchart(data.final, 
#            axistype = 1,
#            maxmin = TRUE,
#            pty = 32,
#            plty = 1,
#            cglty = 0)

# non-normalised
data.nonnorm <- data %>%
  t() %>%
  as.data.frame()

data.final <- rbind(rep(7500, ncol(data.nonnorm)),
                    rep(min(data.nonnorm, na.rm = TRUE), ncol(data.nonnorm)),
                    data.nonnorm)

radarchart(data.final, 
           axistype = 1,
           maxmin = TRUE,
           pty = 32,
           plty = 1,
           cglty = 0)

# plot end prices
endPrices.sorted <- sort(endPrices, decreasing = TRUE)
df <- data.frame(flightIdUnique = names(endPrices.sorted),
           price = endPrices.sorted,
           stringsAsFactors = FALSE) %>%
  left_join(flights.clust %>%
              select(flightIdUnique, cluster, starts_with("departure"), company), by = "flightIdUnique")

df$flightIdUnique <- factor(df$flightIdUnique, levels = names(endPrices.sorted))

df %>%
  ggplot() +
  geom_point(aes(x = flightIdUnique, y = price, color = company)) +
  theme(axis.title.x=element_blank(),
        axis.text.x=element_blank(),
        axis.ticks.x=element_blank())

# company densitys
df %>%
  ggplot() +
  geom_density(aes(x = price, color = company))

# plot 10 day prices
data <- flights.clust %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  filter(timeToDepartureDays >= 1) %>%
  select(flightIdUnique, timeToDepartureDays, price) %>%
  spread(key = flightIdUnique, value = price) %>%
  column_to_rownames("timeToDepartureDays")

tenDayPrices <- data[20, ] %>% as.numeric()
names(tenDayPrices) <- colnames(data)
tenDayPrices.sorted <- sort(tenDayPrices, decreasing = TRUE)
df <- data.frame(flightIdUnique = names(tenDayPrices.sorted),
                 price = tenDayPrices.sorted,
                 stringsAsFactors = FALSE) %>%
  left_join(flights.clust %>%
              select(flightIdUnique, cluster, starts_with("departure"), company), by = "flightIdUnique")

df$flightIdUnique <- factor(df$flightIdUnique, levels = names(tenDayPrices.sorted))

df %>%
  ggplot() +
  geom_point(aes(x = flightIdUnique, y = price, color = company)) +
  theme(axis.title.x=element_blank(),
        axis.text.x=element_blank(),
        axis.ticks.x=element_blank())

# company densitys
df %>%
  ggplot() +
  geom_density(aes(x = price, color = company))



# median price per days to departure
data <- flights.clust %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  filter(timeToDepartureDays <= 60 & timeToDepartureDays >= 1) %>%
  group_by(timeToDepartureDays) %>%
  summarise(medianPrice = median(price, na.rm = TRUE),
            meanPrice = mean(price, na.rm = TRUE),
            countPrices = n())

data %>%
  ggplot() +
  geom_point(aes(x = timeToDepartureDays, y = medianPrice, color = countPrices)) +
  scale_x_reverse()

data %>%
  ggplot() +
  geom_point(aes(x = timeToDepartureDays, y = meanPrice, color = medianPrice)) +
  scale_x_reverse()
