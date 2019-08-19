<script>
  const lineMargin = 15;
  let width;

  $: effectiveWidth = width - lineMargin;
</script>

<div class="text" bind:clientWidth={width}>
  <h4>How to read this chart</h4>
  <p class="mt">
    Each line is showing prices for a flight from Stockholm to Frankfurt for one passenger – collected from
    30 days before departure until the day before takeoff.
    The color at each time point tells whether the price is above or below the final price.
  </p>
</div>
<svg width={width} height="2.2rem">
  <g class="lines">
    <line class="low" x1={lineMargin} y1="10" x2={effectiveWidth / 3} y2="10"></line>
    <line class="high" x1={effectiveWidth / 3 + lineMargin} y1="10" x2={2 * effectiveWidth / 3} y2="10"></line>
    <line class="final" x1={2 * effectiveWidth / 3 + lineMargin} y1="10" x2={3 * effectiveWidth / 3} y2="10"></line>
  </g>
  <g class="labels" transform="translate(0 30)">
    <text transform="translate({effectiveWidth / 6} 0)">below</text>
    <text transform="translate({3 * effectiveWidth / 6} 0)">above</text>
    <text transform="translate({5 * effectiveWidth / 6} 0)">final price</text>
  </g>
</svg>

<style>
  .text {
    font-size: 0.7rem;
  }

  h4 {
    margin: 0.3rem 0;
    font-size: 0.9rem;
    font-weight: bold;
  }

  svg line {
    stroke-width: 0.3rem;
    stroke-linecap: round;
  }

  svg line.low {
    stroke: var(--low-price);
  }

  svg line.high {
    stroke: var(--high-price);
  }

  svg line.final {
    stroke: var(--end-price);
  }

  svg text {
    font-size: 0.7rem;
    fill: var(--gray);
    text-anchor: middle;
  }
</style>
