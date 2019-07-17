data <- flights.clust %>%
  mutate(timeToDepartureDays = round(2*as.numeric(timeToDepartureRounded)/(24*60*60))/2)

data %>%
  ggplot() +
  geom_density(aes(x = price, group = timeToDepartureDays, color = timeToDepartureDays)) +
  facet_wrap(~ cluster) +
  ylim(0, 0.002)
