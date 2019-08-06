<script>
  import { onMount } from 'svelte';

  import {
    select as d3select } from 'd3';

  export let data;
  export let width;
  export let height;
  export let colors;
  export let highlightId = null;

  const sf = 2;
  const globalAlpha = 0.8;
  const dashSwitch = [[], [1, 7]];

  let canvasElement, canvas, ctx;
  let canvasData;
  let line;
  let lineWidth = 2;

  let dotsG;

  function setupCanvas() {
    canvas
      .attr('width', sf * width)
      .attr('height', sf * height)
      .style('width', `${width}px`)
      .style('height', `${height}px`);
    ctx.scale(sf, sf);
    ctx.translate(width / 2, height / 2);
    lineWidth = 2.7 * Math.min(width, height) / 450;
    ctx.lineWidth = lineWidth;
  }

  function renderColorGradients() {
    return data.map(d => {
      let color = ctx.createRadialGradient(0, 0, d.minRadius, 0, 0, d.maxRadius);
      
      color.addColorStop(0, (d.middleStop < 0.01) ? colors.endPrice : colors.lowPrice);
      color.addColorStop(d.middleStop, colors.endPrice);
      color.addColorStop(1, (d.middleStop > 0.99) ? colors.endPrice : colors.highPrice);

      return {
        ...d,
        color
      };
    });
  }

  function drawCanvas(highlightId = null) {
    ctx.clearRect(- width / 2, - height / 2, width, height);
    canvasData.forEach(({ id, path, color }) => {
      ctx.globalAlpha = (!highlightId) ? globalAlpha : ((highlightId === id) ? 1.0 : 0.1);
      ctx.lineCap = 'round';
      ctx.setLineDash(dashSwitch[0]);
      ctx.strokeStyle = color;
      ctx.beginPath();
      path.forEach((point, i , arr) => {
        if (arr[i - 1] && point.gap !== arr[i - 1].gap) {
          ctx.setLineDash(dashSwitch[Number(arr[i - 1].gap)]);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(...arr[i - 1].d.slice(-2));
        }

        if (point.type === 'M') {
          ctx.moveTo(...point.d);
        } else if (point.type === 'C') {
          ctx.bezierCurveTo(...point.d);
        }
      });
      ctx.setLineDash(dashSwitch[Number(path[path.length - 1].gap)]);
      ctx.stroke();
    });
  }

  function highlightFlight(highlightId) {
    const highlightedFlight = data.find(elem => elem.id === highlightId);

    let dots = [];
    if (highlightedFlight) {
      dots = highlightedFlight.path.map((point, i) => {
        return {
          id: i,
          cx: point.d[4] || point.d[0],
          cy: point.d[5] || point.d[1]
        };
      });
      drawCanvas(highlightId);
    } else {
      dots = [];
      drawCanvas();
    }

    d3select(dotsG).selectAll('.dot')
      .data(dots, (d) => d.id)
      .join('circle')
      .attr('class', 'dot')
      .attr('fill', '#321321')
      .attr('fill-opacity', 0.6)
      .attr('r', lineWidth * 1.1)
      .transition().duration(500).delay((d) => 7 * d.id)
      .attr('cx', (d) => +d.cx)
      .attr('cy', (d) => +d.cy);
  }

  onMount(() => {
    canvas = d3select(canvasElement);
    ctx = canvas.node().getContext('2d');
  });

  $: width = width || 0;
  $: height = height || 0;

  $: if (width && height) setupCanvas();

  $: if (canvas && ctx && data && data.length > 0) {
    canvasData = renderColorGradients();
    drawCanvas();
  }

  $: if (data) highlightFlight(highlightId);
</script>

<svg width={width} height={height}>
  <g bind:this={dotsG} transform="translate({width / 2} {height / 2})"></g>
</svg>
<canvas bind:this={canvasElement}></canvas>

<style>
  svg {
    position: absolute;
    z-index: 200;
  }

  canvas {
    position: absolute;
    z-index: 100;
  }
</style>
