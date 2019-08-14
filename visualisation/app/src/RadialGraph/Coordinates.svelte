<script>
  import {
    arc as d3arc,
    curveBasis } from 'd3';

  export let priceScale;
  export let dayToAngle;
  export let priceLabels = [100, 300, 500];
  export let width = 0;
  export let height = 0;
  export let colors;

  const pi2 = Math.PI * 2;
  const arc = d3arc()
    .innerRadius(d => d.radius)
    .outerRadius(d => d.radius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle);

  let priceCoords, dayCoords;

  function addNumberCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

  $: if (priceScale) {
    priceCoords = priceLabels.map(price => ({
      label: `${addNumberCommas(price)} €`,
      radius: priceScale(price)
    }));

    dayCoords = [1, 30].map(day => {
      const angle = dayToAngle(day) + pi2 / 2;
      return {
        label: `-${day}`,
        x1: Math.sin(angle) * priceScale(550),
        y1: Math.cos(angle) * priceScale(550),
        x2: Math.sin(angle) * priceScale(600),
        y2: Math.cos(angle) * priceScale(600)
      };
    });
  }
</script>

<svg width={width || 0} height={height || 0}>
  {#if priceCoords}
    <g class="price-coords" transform="translate({width / 2} {height / 2})">
      {#each priceCoords as { label, radius, startAngle, endAngle }, i}
        <g class="price-coord">
          <path class="price-circle" d={arc({radius, startAngle: 0, endAngle: pi2})}></path>
          <g class="price-label" transform="translate(0 {- radius - 6})">
            <text>
                {label}
            </text>
          </g>
        </g>
      {/each}
    </g>
    <g class="day-coords" transform="translate({width / 2} {height / 2})">
      {#each dayCoords as { label, x1, y1, x2, y2 }}
        <g class="day-coord">
          <!-- <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="{colors.lightGray}"></line> -->
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

  g.price-coord path.price-circle {
    stroke: var(--light-gray);
    stroke-width: 0.4vmin;
    stroke-opacity: 0.4;
  }

  g.price-coord text {
    fill: var(--light-gray);
    text-anchor: middle;
    font-size: 0.9rem;
  }
</style>
