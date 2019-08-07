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
  {#await data.find(elem => elem.name === 'flightInfo').data then data}
    <div class="bottom-wrapper">
      <div class="container time-brush">
        <TimeBrush data={data}
                   colors={colors}
                   on:timerangeselected={(e) => timeRange = e.detail} />
      </div>
    </div>
    <div class="flight-card">
      <FlightCard data={data.find(elem => elem.flightIdUnique === highlightedFlightId)}/>
    </div>
  {/await}
</div>

<style>
  .outer-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .title-bar {
    position: absolute;
    z-index: -1;
    width: 100%;
    padding: 1rem 0 0 0;
    text-align: center;
  }

  h1 {
    font-size: 3rem;
    font-weight: 400;
    color: #444;
  }

  h3 {
    font-size: 1rem;
    font-weight: 400;
    color: var(--gray);
  }

  .top-wrapper {
    flex: 1;
  }

  .flight-card {
    position: absolute;
    bottom: 17%;
    z-index: 1;
    width: 100%;
    height: 20%;
    max-height: 43vw;
  }

  .bottom-wrapper {
    position: absolute;
    bottom: 0;
    z-index: 1000;
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
