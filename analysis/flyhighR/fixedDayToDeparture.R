days <- 30
dateBreak <- "2019-06-01"

# spring flights
flights.fixedSpring <- flights %>%
  filter(departure < ymd(dateBreak)) %>%
  filter(timeToDepartureRounded <= days(days)) %>%
  mutate(daysToDeparture = as.numeric(timeToDepartureRounded)/(60 * 60 * 24)) %>%
  mutate(season = "spring") %>%
  select(-timeToDepartureRounded)

# summer flights
flights.fixedSummer <- flights %>%
  filter(departure >= ymd(dateBreak)) %>%
  filter(timeToDepartureRounded <= days(days)) %>%
  mutate(daysToDeparture = as.numeric(timeToDepartureRounded)/(60 * 60 * 24)) %>%
  mutate(season = "summer") %>%
  select(-timeToDepartureRounded)

data <- rbind(flights.fixedSpring, flights.fixedSummer)

data %>%
  ggplot() +
  geom_density(aes(x = price, group = daysToDeparture, color = daysToDeparture)) +
  facet_wrap(~ season, nrow = 2) + 
  ylim(0, 0.002)

data %>%
  ggplot() +
  geom_freqpoly(aes(x = price, group = daysToDeparture, color = daysToDeparture)) +
  facet_wrap(~ season, nrow = 2)

# based on discrete prices
data.priceGrouped <- data %>%
  group_by(daysToDeparture, price, season) %>%
  summarise(price_count = n())

data.priceGrouped %>%
  ggplot() +
  geom_bar(aes(x = price, y = price_count, color = daysToDeparture, group = daysToDeparture), stat = "identity") +
  facet_wrap(~ season, nrow = 2)
