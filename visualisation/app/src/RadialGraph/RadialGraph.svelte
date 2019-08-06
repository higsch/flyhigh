<script>
  import Coordinates from './Coordinates.svelte';
  import RadialCanvas from './RadialCanvas.svelte';

  import {
    max as d3max,
    nest,
    scaleLinear,
    lineRadial,
    curveCatmullRom } from 'd3';
  import { formatTime } from '../utils';

  export let data;
  export let timeRange = [];
  export let colors;

  const sizeOffset = 10;
  const pi2 = 2 * Math.PI;
  const days = 30;
  const timeStep = 0.5;
  const daysOnCircle = 35;
  const dayOffset = -2;

  const line = lineRadial()
    .angle(d => d.angle)
    .radius(d => d.radius)
    .curve(curveCatmullRom.alpha(0.5));

  let width, height;
  let maxPrice = 0;
  let priceScale;
  let dataPreCalc;
  let radialDataIndex;
  let slicedData;

  function dayToAngle(day) {
    return -pi2 * day / daysOnCircle + pi2 * dayOffset / daysOnCircle;
  }

  function preCalculateGeometry(dataNested) {
    return dataNested.map(priceLine => {
      let priceLineData = [];
      let endRadius = -100;
      let gapArr = [];
      let previousDay = days;

      priceLine.values.forEach(d => {
        const radius = priceScale(d.price);
        const angle = dayToAngle(d.timeToDepartureDays);

        if (d.timeToDepartureDays === 1) endRadius = radius;

        const point = {
          radius,
          angle
        };
        priceLineData.push(point);

        // Keep track of data gaps
        gapArr.push(previousDay - d.timeToDepartureDays > timeStep);
        previousDay = d.timeToDepartureDays;
      });
      
      const minRadius = Math.min(...priceLineData.map(elem => elem.radius));
      const maxRadius = Math.max(...priceLineData.map(elem => elem.radius));
      const middleStop = Math.min((endRadius - minRadius) / (maxRadius - minRadius), 1.0) || 0;

      // Calculate the path for the whole line
      const path = line(priceLineData);
      const objectPath = path.split('C').map((elem, i) =>{
        return {
          type: elem[0] === 'M' ? 'M' : 'C', 
          gap: gapArr[i] || false,
          d: elem.replace('M', '').split(',')
        };
      });

      return {
        id: priceLine.key,
        path: objectPath,
        minRadius,
        maxRadius,
        endRadius,
        middleStop,
        departure: priceLine.values[0].departure
      };
    });
  }

  $: if (width && height && data && data.length > 0) {
    // Get the maximum price in the whole dataset
    maxPrice = d3max(data, d => d.price);
    
    // Define the price scale, i.e. radii
    priceScale = scaleLinear()
      .domain([0, maxPrice])
      .range([Math.min(width, height) / 11, Math.min(width, height) * 0.55]);

    // Nest the data by unique flights
    const dataNested = nest()
      .key(d => d.flightIdUnique)
      .entries(data);

    // Precalculate geometrical parameters for the whole dataset
    dataPreCalc = preCalculateGeometry(dataNested);

    // build a departure index
    if (dataPreCalc.length > 0) {
      radialDataIndex = {};
      dataPreCalc.forEach((d, index) => {
        const departure = formatTime(d.departure);
        if (!Object.keys(radialDataIndex).includes(departure)) {
          radialDataIndex[departure] = [index];
        } else {
          radialDataIndex[departure] = [radialDataIndex[departure][0], index];
        }
      });
    }
  }

  $: if (dataPreCalc) {
    if (radialDataIndex && timeRange.length === 2) {
      if (timeRange.reduce((a, c) => Math.abs(a - c)) / (1000 * 60 * 60) <= 24) {
        timeRange = [timeRange[0], timeRange[0]];
      }
      const tr = timeRange.map(formatTime);
      const start = radialDataIndex[tr[0]][0];
      const stop = radialDataIndex[tr[1]][1] || radialDataIndex[tr[1]][0];
      slicedData = dataPreCalc.slice(start, stop + 1);
    } else {
      slicedData = dataPreCalc;
    }
  }
</script>

<div class="wrapper" bind:offsetWidth={width} bind:offsetHeight={height}>
  <Coordinates priceScale={priceScale}
               dayToAngle={dayToAngle}
               width={width - sizeOffset}
               height={height - sizeOffset}
               colors={colors} />
  <RadialCanvas data={slicedData}
                width={width - sizeOffset}
                height={height - sizeOffset}
                colors={colors} />
</div>

<style>
</style>
