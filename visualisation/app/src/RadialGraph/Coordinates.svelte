<script>
  import {
    arc as d3arc,
    curveBasis,
    range as d3range } from 'd3';

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
  const maxDays = 31;
  const arcDays = d3arc()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle);

  let priceCoords, dayArcs;

  function addNumberCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

  $: if (priceScale) {
    priceCoords = priceLabels.map(price => ({
      label: `${addNumberCommas(price)} €`,
      radius: priceScale(price)
    }));

    dayArcs = d3range(1, maxDays - 1, 1).map(day => {
      return {
        innerRadius: priceScale(525),
        outerRadius: priceScale(550),
        startAngle: dayToAngle(day),
        endAngle: dayToAngle(day + 1)
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
  {/if}
  {#if dayArcs}
    <g class="day-arcs" transform="translate({width / 2} {height / 2})">
      {#each dayArcs as a, i}
        <path d="{arcDays(a)}" class={i % 2 === 0 ? 'even' : 'odd'}></path>
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

  g text {
    fill: var(--light-gray);
    text-anchor: middle;
    font-size: 0.9rem;
  }

  g.day-arcs path.odd {
    fill: none;
  } 

  g.day-arcs path.even {
    fill: var(--light-gray);
    fill-opacity: 0.4;
  }
</style>
