<script>
  import Coordinates from './Coordinates.svelte';
  import RadialCanvas from './RadialCanvas.svelte';

  import {
    max as d3max,
    nest,
    scaleLinear } from 'd3';
  import { formatTime } from '../utils';

  export let data;
  export let minMaxTime = [];
  export let maxAnimate = 50;
  export let colors;

  const pi2 = 2 * Math.PI;
  const daysOnCircle = 35;
  const dayOffset = 1;

  let width, height;
  let maxPrice = 0;
  let priceScale;
  let dataPreCalc;
  let radialDataIndex = {};
  let slicedData;

  function dayToAngle(day) {
    return -pi2 * day / daysOnCircle + pi2 * dayOffset / daysOnCircle;
  }

  function preCalculateGeometry(dataNested) {
    return dataNested.map(priceLine => {
      let priceLineData = [];
      let endRadius = -100;

      priceLine.values.forEach(d => {
        const radius = priceScale(d.price);
        const angle = dayToAngle(d.timeToDepartureDays);

        if (d.timeToDepartureDays === 1) endRadius = radius;

        const point = {
          radius,
          angle
        };
        priceLineData.push(point);
      });

      const minRadius = Math.min(...priceLineData.map(elem => elem.radius));
      const maxRadius = Math.max(...priceLineData.map(elem => elem.radius));
      const middleStop = Math.min((endRadius - minRadius) / (maxRadius - minRadius), 1.0) || 0;

      return {
        priceLineData,
        minRadius,
        maxRadius,
        endRadius,
        middleStop,
        departure: priceLine.values[0].departure
      };
    });
  }

  $: if (width && height && data) {
    // Get the maximum price in the whole dataset
    maxPrice = d3max(data, d => d.price);

    // Define the price scale, i.e. radii
    priceScale = scaleLinear()
      .domain([0, maxPrice])
      .range([width / 8, Math.min(width, height) * 0.5]);

    // Nest the data by unique flights
    const dataNested = nest()
      .key(d => d.flightIdUnique)
      .entries(data);

    // Precalculate geometrical parameters for the whole dataset
    dataPreCalc = preCalculateGeometry(dataNested);

    // build a departure index
    dataPreCalc.forEach((d, index) => {
      const departure = formatTime(d.departure);
      if (!Object.keys(radialDataIndex).includes(departure)) {
        radialDataIndex[departure] = [index];
      } else {
        radialDataIndex[departure] = [radialDataIndex[departure][0], index];
      }
    });
  }

  $: if (dataPreCalc) {
    if (minMaxTime.length === 2) {
      const start = radialDataIndex[minMaxTime[0]][0];
      const stop = radialDataIndex[minMaxTime[1]][1];
      if (Math.abs(stop - start) <= maxAnimate) {
        slicedData = dataPreCalc.slice(start, stop + 1);
      }
    } else {
      slicedData = dataPreCalc;
    }
  }
</script>

<div class="wrapper" bind:offsetWidth={width} bind:offsetHeight={height}>
  <Coordinates />
  <RadialCanvas data={slicedData}
                width={width}
                height={height}
                colors={colors} />
</div>

<style>
</style>
