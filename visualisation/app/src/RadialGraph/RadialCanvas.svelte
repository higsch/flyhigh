<script>
  import { onMount } from 'svelte';

  import {
    select as d3select,
    lineRadial,
    curveCatmullRom } from 'd3';

  // import * as d3 from 'd3';

  export let data;
  export let width;
  export let height;
  export let colors;

  const sf = 2;

  let canvasElement, canvas, ctx;
  let canvasData;
  let line;
  let lineWidth = 2;

  function setupCanvas() {
    canvas
      .attr('width', sf * width)
      .attr('height', sf * height)
      .style('width', `${width}px`)
      .style('height', `${height}px`);
    ctx.scale(sf, sf);
    ctx.translate(width / 2, height / 2);
    lineWidth = 2 * Math.min(width, height) / 500;
  }

  function renderColorGradients() {
    return data.map(d => {
      let color;
      color = ctx.createRadialGradient(0, 0, d.minRadius, 0, 0, d.maxRadius);
      
      if (d.middleStop < 0.01) {
        color.addColorStop(0, colors.endPrice);
      } else {
        color.addColorStop(0, colors.lowPrice);
      }

      color.addColorStop(d.middleStop, colors.endPrice);

      if (d.middleStop > 0.99) {
        color.addColorStop(1, colors.endPrice);
      } else {
        color.addColorStop(1, colors.highPrice);
      }

      return {
        ...d,
        color
      };
    });
  }

  function drawCanvas() {
    ctx.clearRect(-width / 2, -height / 2, width, height);
    canvasData.forEach(d => {
      ctx.beginPath();
      line(d.priceLineData);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = d.color;
      ctx.stroke();
    });
  }

  onMount(() => {
    canvas = d3select(canvasElement);
    ctx = canvas.node().getContext('2d');
    line = lineRadial()
      .angle(d => d.angle)
      .radius(d => d.radius)
      .curve(curveCatmullRom.alpha(0.5))
      .context(ctx);
    ctx.lineCap = 'round';
  });

  $: if (width && height) {
    setupCanvas();
  }

  $: if (canvas && ctx && data && data.length > 0) {
    canvasData = renderColorGradients();
    drawCanvas();
  }
</script>

<canvas bind:this={canvasElement}></canvas>

<style>
  canvas {
    position: absolute;
    z-index: 100;
  }
</style>
