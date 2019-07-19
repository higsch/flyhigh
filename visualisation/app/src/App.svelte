<script>
  import RadialGraph from './RadialGraph/RadialGraph.svelte';
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
          price: +d.price,
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

  // Set up the basic data object
  let data = dataPaths.map(elem => ({name: elem.name, data: []}));

  let timeRange = [];

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

<div class="outer-wrapper">
  <div class="top-wrapper">
    <div class="container radial-graph">
      {#await data.find(elem => elem.name === 'flights').data then data}
        <RadialGraph data={data}
                     timeRange={timeRange}
                     colors={colors} />
      {/await}
    </div>
  </div>
  <div class="bottom-wrapper">
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
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .top-wrapper {
    flex: 1;
  }

  .bottom-wrapper {
    height: 13%;
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
