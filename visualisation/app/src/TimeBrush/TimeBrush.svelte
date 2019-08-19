<script>
  import { onMount, createEventDispatcher } from 'svelte';

  import {
    select as d3select,
    scaleTime,
    extent,
    scaleLinear,
    max as d3max,
    line as d3line,
    curveMonotoneX,
    timeFormat,
    brushX,
    event as d3event,
    timeDay } from 'd3';
  import { timeParser } from '../utils';

  export let data;
  export let colors;

  const shrinkingFactor = 0.75;
  const dispatch = createEventDispatcher();
  const padding = {
    top: 20,
    bottom: 10
  };
  const initTime = {
    start: timeParser('2019-04-29T00:00:00Z'),
    end: timeParser('2019-04-30T00:00:00Z')
  };

  let dataMonth;
  let width, height;
  let svgElement;
  let x, y;
  let line;
  let path;
  let ticks;
  let brush;
  let isInit = true;
  let previousBrush = initTime;
  let selectedMonth;
  let brushPosition = [];

  function brushed() {
    if (!isInit && !d3event.sourceEvent || !d3event.selection) return;
    isInit = false;
    
    const selectionX = d3event.selection;
    let selectionTime = selectionX.map(x.invert);

    let selectionTimeRounded = selectionTime.map(timeDay.round);

    if (selectionTimeRounded[0] >= selectionTimeRounded[1]) {
      selectionTimeRounded[0] = timeDay.floor(selectionTime[0]);
      selectionTimeRounded[1] = timeDay.offset(selectionTimeRounded[0]);
    }

    if (selectionTimeRounded[1] > x.domain()[1]) {
      selectionTimeRounded[1] = x.domain()[1];
    }

    // Subtract a few milliseconds to get to the day before
    selectionTimeRounded[1] = new Date(selectionTimeRounded[1] - 100);

    if (d3event.type === 'end') {
      d3select(this).transition().call(d3event.target.move, selectionTimeRounded.map(x));
    }

    if (previousBrush.toString() !== selectionTimeRounded.toString()) {
      previousBrush = selectionTimeRounded;
      dispatch('timerangeselected', selectionTimeRounded);
      brushPosition = selectionX;
    }
  }

  function selectMonth(month) {
    if (!month) return;
    isInit = true;
    dataMonth = data.filter(elem => elem.departure.getMonth() === month);
  }

  onMount(() => {
    selectedMonth = 3;
  });
  
  $: selectMonth(selectedMonth);

  $: if (dataMonth && dataMonth.length > 0 && width && height) {
    x = scaleTime()
      .domain(extent(dataMonth, d => d.departure))
      .range([0, width]);

    y = scaleLinear()
      .domain([0, d3max(data, d => d.endPrice)])
      .range([height * shrinkingFactor, padding.top]);

    line = d3line()
      .x(d => x(d.departure))
      .y(d => y(d.endPrice))
      .curve(curveMonotoneX);
    
    path = line(dataMonth);

    const tickInterval = 3;
    let lastTime = dataMonth[0].departure;
    ticks = dataMonth.map(({ departure }, index) => {
      let show;
      if ((departure - lastTime) / (1000 * 60 * 60 * 24) >= tickInterval) {
        lastTime = departure;
        show = true;
      } else {
        show = false;
      }
      return {
        id: index,
        departure,
        show
      };
    });
    ticks = ticks.slice(3, -3);
  }

  $: if (svgElement && x) {
    d3select(svgElement).selectAll('g.brush').remove();

    brush = brushX()
      .extent([[0, 0], [width, height * shrinkingFactor]])
      .on('brush end', brushed);

    d3select(svgElement).append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move,
        [x(timeParser(`2019-0${selectedMonth + 1}-10T00:00:00Z`)), x(timeParser(`2019-0${selectedMonth + 1}-11T00:00:00Z`))]);
  }
</script>

<div class="wrapper" bind:offsetWidth={width} bind:offsetHeight={height}>
  <div class="top-line">
    <div class="label">Final prices per departure date in</div>
    <div class="month-selector" class:active={selectedMonth === 3} on:click={() => selectedMonth = 3}>April</div>
    <div class="month-selector" class:active={selectedMonth === 4} on:click={() => selectedMonth = 4}>May</div>
    <div class="month-selector" class:active={selectedMonth === 5} on:click={() => selectedMonth = 5}>June</div>
    <div class="label">2019</div>
    <!-- <div class="month-selector" class:active={selectedMonth === 6} on:click={() => selectedMonth = 6}>July</div> -->
  </div>
  {#if path}
    <svg bind:this={svgElement}>
      <g class="axis" transform="translate(0 {height * shrinkingFactor - padding.bottom})">
        {#each ticks as {departure, show, id}, i (id)}
          {#if show}
            <g class="tick" transform="translate({x(departure)} 0)">
              <circle cx={0} cy={-12} r="2"></circle>
              <text>{timeFormat('%b %d')(departure)}</text>
            </g>
          {/if}
        {/each}
      </g>
      <g class="end-price" transform="translate(0 -10)">
        <path class="end-price-line"
              stroke-width={Math.max(width, height * shrinkingFactor) / 700}
              d={path}></path>
      </g>
    </svg>
  {/if}
</div>

<style>
  .wrapper {
    flex-direction: column;
  }

  .top-line {
    align-self: flex-start;
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
  }

  .label {
    font-size: 0.8rem;
    color: var(--gray);
  }

  .month-selector {
    margin: 0.3rem;
    padding: 0.3rem;
    font-size: 0.9rem;
    color: var(--gray);
    background-color: var(--end-price);
    border-radius: 3px;
    border: 2px solid transparent;
    cursor: pointer;
  }

  .month-selector:hover, .month-selector.active {
    border-color: var(--gray);
  }

  svg {
    width: 100%;
    height: 100%;
  }

  svg text {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
  }

  g.end-price path {
    stroke: var(--end-price);
    fill: none;
  }

  g.tick text {
    fill: var(--gray);
    font-size: 0.7rem;
    text-anchor: middle;
  }

  g.tick circle {
    fill: var(--gray);
  }
</style>
