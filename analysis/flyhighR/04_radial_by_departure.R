# by departure
data <- flights.clust %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2) %>%
  filter(timeToDepartureDays == 1)

data %>%
  ggplot() +
  geom_point(aes(x = departure, y = price, color = departureHour))

