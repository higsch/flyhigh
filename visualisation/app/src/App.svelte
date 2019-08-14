<script>
  import RadialGraph from './RadialGraph/RadialGraph.svelte';
  import FlightCard from './FlightCard/FlightCard.svelte';
  import TimeBrush from './TimeBrush/TimeBrush.svelte';

  import { onMount } from 'svelte';

  import { csv as d3csv } from 'd3';
  import { timeParser } from './utils';

  // Define the data sources and define formatting callbacks
  const dataPaths = [
    {
      name: 'flightInfo',
      path: '/data/flight_info.csv',
      callback: function (d) {
        return {
          ...d,
          arrival: timeParser(d.arrival),
          departure: timeParser(d.departure),
          departureRounded: timeParser(d.departureRounded),
          meanPrice: +d.meanPrice,
          medianPrice: +d.medianPrice,
          sumPrice: +d.sumPrice,
          sdPrice: +d.sdPrice,
          endPrice: isNaN(+d.endPrice) ? 0 : +d.endPrice
        };
      }
    },
    {
      name: 'flights',
      path: '/data/flights_by_day_to_departure.csv',
      callback: function (d) {
        return {
          ...d,
          price: parseFloat(d.price),
          timeToDepartureDays: +d.timeToDepartureDays,
          departure: timeParser(d.departure)
        };
      }
    }
  ];

  // Setup the colors
  const colors = {
    lowPrice: '#2274A5',
    endPrice: '#E3D8F1',
    highPrice: '#EF6461',
    lightGray: '#DDD'
  };

  let width, height;
  // Set up the basic data object
  let data = dataPaths.map(elem => ({name: elem.name, data: []}));

  let timeRange = [];

  let highlightedFlightId = null;

  async function assembleFlightDetails(id) {
    const flightInfo = await data.find(elem => elem.name === 'flightInfo').data
  }

  // Fetch the data from csv and convert to D3 appropriate json
  onMount(async function () {
    data = await Promise.all(dataPaths.map(entry => {
      return {
        name: entry.name,
        data: d3csv(entry.path, entry.callback)
      };
    }));
  });
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />
<svelte:body width={width} height={height} />

<div class="outer-wrapper">
  <div class="title-bar">
    <h1>30 days to takeoff</h1>
    <h3>Following thousands of flight prices starting a month before departure.</h3>
  </div>
  <div class="top-wrapper">
    <div class="container radial-graph">
      {#await data.find(elem => elem.name === 'flights').data then data}
        <RadialGraph data={data}
                     timeRange={timeRange}
                     colors={colors}
                     on:flightclick={(e) => highlightedFlightId = e.detail} />
      {/await}
    </div>
  </div>
  <div class="info-bar">
    <div class="left legend">
      <div class="legend-text">
        <h4>How to read this chart</h4>
        <p class="mt">Lines represent flight prices. They run clockwise from 30 days before
          departure to one day before takeoff.</p>
        <p class="mt">The color at each time point tells you whether the price is <em class="high">above</em>
          the final ticket or <em class="low">below</em> the <em class="end">final price</em>.</p>
      </div>
      <svg class="color-legend"></svg>
      <div class="legend-info">Check out further explanations in the desktop version.</div>
    </div>
    <div class="right">
      {#await data.find(elem => elem.name === 'flightInfo').data then data}
        <div class="flight-card">
          <FlightCard data={data.find(elem => elem.flightIdUnique === highlightedFlightId)}/>
        </div>
      {/await}
    </div>
  </div>
  <div class="time-bar">
    <div class="container time-brush">
      {#await data.find(elem => elem.name === 'flightInfo').data then data}
        <TimeBrush data={data}
                   colors={colors}
                   on:timerangeselected={(e) => timeRange = e.detail} />
      {/await}
    </div>
  </div>
</div>

<style>
  .outer-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }

  .title-bar {
    z-index: 300;
    width: 100%;
    padding: 1vh 0 0 0;
    text-align: center;
  }

  h1 {
    font-size: calc(1.8rem + 2.5vh);
    font-weight: bold;
    color: #444;
  }

  h3 {
    margin: 0.2rem 0;
    font-size: calc(0.8rem + 0.2vw);
    font-weight: normal;
    color: var(--gray);
  }

  h4 {
    margin: 0.3rem 0;
    font-size: 1.1rem;
    font-weight: bold;
  }

  .top-wrapper {
    position: absolute;
    z-index: 100;
    width: 100%;
    height: 90%;
    top: 5%;
  }

  .info-bar {
    z-index: -1;
    flex: 1;
    display: flex;
    justify-content: space-between;
  }

  .info-bar > div {
    max-width: 30%;
    padding: 0.5rem;
    color: var(--gray);
  }

  .legend-info {
    display: none;
    font-size: 0.8rem;
  }

  @media (orientation: portrait) {
    .info-bar {
      flex-direction: column;
      align-items: center;
    }

    .info-bar > div {
      max-width: 100%;
    }

    .legend-text {
      display: none;
    }

    .legend-info {
      display: block;
    }
  }

  .legend {
    margin: 1rem 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  .flight-card {
    position: absolute;
    bottom: 17%;
    z-index: 1;
    width: 100%;
    height: 20%;
    max-height: 43vw;
  }

  .time-bar {
    z-index: 300;
    width: 100%;
    height: 17%;
  }

  .container.radial-graph {
    width: 100%;
    height: 100%;
  }

  .container.time-brush {
    width: 100%;
    height: 100%;
  }
</style>
