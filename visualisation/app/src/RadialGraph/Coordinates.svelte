<script>
  import {
    arc as d3arc,
    curveBasis } from 'd3';

  export let priceCoords;
  export let width = 0;
  export let height = 0;

  const arc = d3arc()
    .innerRadius(d => d.radius)
    .outerRadius(d => d.radius)
    .startAngle(d => d.angleStart)
    .endAngle(d => d.angleEnd);
</script>

<svg width={width || 0} height={height || 0}>
  {#if priceCoords}
    <g class="price-coords" transform="translate({width / 2} {height / 2})">
      {#each priceCoords as { label, radius, angleStart, angleEnd }}
        <g class="price-coord">
          <path d={arc({radius, angleStart, angleEnd})}></path>
        </g>
      {/each}
    </g>
  {/if}
</svg>

<style>
  svg {
    position: absolute;
    z-index: 0;
  }

  g.price-coord path {
    stroke: var(--light-gray);
    stroke-opacity: 0.3;
    stroke-width: 0.2rem;
  }
</style>
