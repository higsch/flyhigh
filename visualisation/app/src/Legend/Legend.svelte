<script>
  const margin = 15;
  let width, height;

  $: lineWidth = ((width || 0) - margin * 3) / 3;
  $: svgHeight = (height || 0) / 2;
  $: lineYOffset = svgHeight / 1.5;
  $: textYOffset = svgHeight / 2.5;
</script>

<div class="text" bind:clientWidth={width} bind:clientHeight={height}>
  <h4>How to read this chart</h4>
  <p class="mt">
    Each line is showing prices for a flight from Stockholm to Frankfurt for one passenger – collected from
    30 days before departure until the day before takeoff.
    The color at each time point tells whether the price is above or below the final price.
    Change the time points by sliding the brush and try to click on the lines.
  </p>
</div>
<svg width={width} height={svgHeight}>
  <g class="first" transform="translate({margin / 2} 0)">
    <line class="low" x1="0" y1={lineYOffset} x2={lineWidth} y2={lineYOffset}></line>
    <text transform="translate({lineWidth / 2} {textYOffset})">below</text>
  </g>
  <g class="second" transform="translate({1.5 * margin + lineWidth} 0)">
    <line class="high" x1="0" y1={lineYOffset} x2={lineWidth} y2={lineYOffset}></line>
    <text transform="translate({lineWidth / 2} {textYOffset})">above</text>
  </g>
  <g class="third" transform="translate({2.5 * margin + 2 * lineWidth} 0)">
    <line class="final" x1="0" y1={lineYOffset} x2={lineWidth} y2={lineYOffset}></line>
    <text transform="translate({lineWidth / 2} {textYOffset})">final price</text>
  </g>
</svg>

<style>
  .text {
    margin: 0 0 0.5rem 0;
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
