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
