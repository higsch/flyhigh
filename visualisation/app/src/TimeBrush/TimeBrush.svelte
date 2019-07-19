<script>
  import { createEventDispatcher } from 'svelte';

  import {
    select as d3select,
    scaleTime,
    extent,
    scaleLinear,
    max as d3max,
    area as d3area,
    curveBasis,
    timeFormat,
    brushX,
    event as d3event,
    timeDay } from 'd3';
  import { timeParser } from '../utils';

  export let data;
  export let colors;

  const dispatch = createEventDispatcher();
  const padding = {
    top: 20
  };
  const initTime = {
    start: timeParser('2019-05-02T00:00:00Z'),
    end: timeParser('2019-05-03T00:00:00Z')
  };

  let width, height;
  let svgElement;
  let x, y;
  let area;
  let path;
  let ticks;
  let brush;
  let isInit = true;

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

    if (d3event.type === 'end') {
      d3select(this).transition().call(d3event.target.move, selectionTimeRounded.map(x));
    }

    dispatch('timerangeselected', selectionTimeRounded);
  }

  $: if (data && data.length > 0 && width && height) {
    x = scaleTime()
      .domain(extent(data, d => d.departure))
      .range([0, width]);

    y = scaleLinear()
      .domain([0, d3max(data, d => d.endPrice)])
      .range([height, padding.top]);

    area = d3area()
      .x(d => x(d.departure))
      .y0(y(0))
      .y1(d => y(d.endPrice))
      .curve(curveBasis);
    
    path = area(data);

    let lastTime = data[0].departure;
    ticks = data.map(({ departure }, index) => {
      let show;
      if ((departure - lastTime) / (1000 * 60 * 60 * 24) >= 7) {
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
  }

  $: if (svgElement && x) {
    d3select(svgElement).selectAll('g.brush').remove();

    brush = brushX()
      .extent([[0, 0], [width, height]])
      .on('brush end', brushed);

    d3select(svgElement).append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move,
        [x(initTime.start), x(initTime.end)]);
  }
</script>

<div class="wrapper" bind:offsetWidth={width} bind:offsetHeight={height}>
  {#if path}
    <svg bind:this={svgElement}>
      <g class="axis" transform="translate(0 {padding.top})">
        {#each ticks as {departure, show, id}, i (id)}
          {#if show}
            <g class="tick" transform="translate({x(departure)} 0)">
              <text>{timeFormat('%b, %d')(departure)}</text>
              <line x1={0} y1={0} x2={0} y2={5} transform="translate(0 6)"></line>
            </g>
          {/if}
        {/each}
      </g>
      <g class="end-price">
        <path class="end-price-area"
              d={path}></path>
      </g>
    </svg>
  {/if}
</div>

<style>
  svg {
    width: 100%;
    height: 100%;
  }

  g.end-price {
    fill: var(--end-price);
  }

  g.tick text {
    fill: var(--gray);
    font-size: 0.7rem;
    text-anchor: middle;
  }

  g.tick line {
    stroke: var(--gray);
    stroke-linecap: round;
  }
</style>
