<script>
  import Coordinates from './Coordinates.svelte';
  import RadialCanvas from './RadialCanvas.svelte';

  import {
    max as d3max,
    nest,
    scaleLinear,
    lineRadial,
    curveCatmullRom,
    timeFormat } from 'd3';
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
  let legendArr = [];

  let nextCol = 1;

  function generateColor(){
    let ret = [];
    if(nextCol < 16777215) {
      ret.push(nextCol & 0xff); // R
      ret.push((nextCol & 0xff00) >> 8); // G 
      ret.push((nextCol & 0xff0000) >> 16); // B

      nextCol += 1;
    }
    const col = `rgb(${ret.join(',')})`;
    return col;
  }

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
          angle,
          price: d.price,
          timeToDepartureDays: d.timeToDepartureDays
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
          d: elem.replace('M', '').split(','),
          price: priceLineData[i].price,
          timeToDepartureDays: priceLineData[i].timeToDepartureDays
        };
      });

      return {
        id: priceLine.key,
        path: objectPath,
        minRadius,
        maxRadius,
        endRadius,
        middleStop,
        departure: priceLine.values[0].departure,
        colorId: generateColor()
      };
    });
  }

  function formatCenterTimeRange(timeRange) {
    const weekday = timeFormat('%a')(timeRange[0]);
    const time1 = timeFormat('%b %d')(timeRange[0]).replace(' ', '&nbsp;');
    const time2 = timeFormat('%d')(timeRange[1]).replace(' ', '&nbsp;');
    return (time1 === timeFormat('%b %d')(timeRange[1]).replace(' ', '&nbsp;')) ? `${weekday}, ${time1}` : `${time1} - ${time2}`;
  }

  function prepareData() {
    maxPrice = d3max(data, d => d.price);
    
    // Define the price scale, i.e. radii
    priceScale = scaleLinear()
      .domain([0, maxPrice])
      .range([Math.min(width, height) / 11, Math.min(width, height) * 0.5]);

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

  function sliceData(timeRange) {
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

  $: if (width && height && data && data.length > 0) prepareData();

  $: if (dataPreCalc) sliceData(timeRange);
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
                colors={colors}
                on:flightclick />
  {#if priceScale && timeRange}
    <div class="selected-time-range"
         style="width: {priceScale(300)}px;">
      <span class="pre-string">Departure</span>
      {@html formatCenterTimeRange(timeRange)}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    max-width: 1060px;
    margin: 0 auto;
  }

  .selected-time-range {
    position: absolute;
    z-index: 100;
    font-size: calc(0.5rem + 1vw);
    text-align: center;
    color: var(--gray);
  }

  .selected-time-range .pre-string {
    display: block;
    font-size: calc(0.7rem + 0.6vw);
  }
</style>
