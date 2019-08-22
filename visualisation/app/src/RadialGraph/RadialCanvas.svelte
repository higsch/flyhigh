<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  import {
    select as d3select } from 'd3';

  export let data;
  export let width;
  export let height;
  export let colors;

  const dispatch = createEventDispatcher();
  const sf = 2;
  const globalAlpha = 1.0;
  const dashSwitch = [[], [1, 7]];

  let canvasElement, hiddenCanvasElement, canvas, ctx, hiddenCanvas, hiddenCtx;
  let canvasData;
  let line;
  let lineWidth = 2;

  let dotsG;

  let highlightId = null;
  let highlightedPoints = 60;

  let tooltip;

  function setupCanvas() {
    lineWidth = 2.7 * Math.min(width, height) / 450;

    function init(canvas, ctx) {
      canvas
        .attr('width', sf * width)
        .attr('height', sf * height)
        .style('width', `${width}px`)
        .style('height', `${height}px`);
      ctx.scale(sf, sf);
      ctx.translate(width / 2, height / 2);
      ctx.lineWidth = ctx.canvas.classList[0] === 'hidden' ? 2 * lineWidth : lineWidth;
      return [canvas, ctx];
    }

    [canvas, ctx] = init(canvas, ctx);
    [hiddenCanvas, hiddenCtx] = init(hiddenCanvas, hiddenCtx);
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

  function drawCanvas(mode, highlightId = null) {
    const context = (mode === 'hidden') ? hiddenCtx : ctx;

    context.clearRect(- width / 2, - height / 2, width, height);

    canvasData.forEach(({ id, path, color, colorId }) => {
      context.globalAlpha = (!highlightId) ? globalAlpha : ((highlightId === id) ? 1.0 : 0.1);
      context.lineCap = 'round';
      context.setLineDash(dashSwitch[0]);
      context.strokeStyle = mode === 'hidden' ? colorId : color;
      context.beginPath();
      path.forEach((point, i , arr) => {
        if (arr[i - 1] && point.gap !== arr[i - 1].gap) {
          context.setLineDash(dashSwitch[Number(arr[i - 1].gap)]);
          context.stroke();
          context.beginPath();
          context.moveTo(...arr[i - 1].d.slice(-2));
        }

        if (point.type === 'M') {
          context.moveTo(...point.d);
        } else if (point.type === 'C') {
          context.bezierCurveTo(...point.d);
        }
      });
      context.setLineDash(dashSwitch[Number(path[path.length - 1].gap)]);
      context.stroke();
    });
  }

  function highlightFlight(highlightId) {
    if (!data) return;

    const highlightedFlight = data.find(elem => elem.id === highlightId);

    let dots = [];
    if (highlightedFlight) {
      dots = highlightedFlight.path.map((point, i) => {
        return {
          id: i,
          cx: point.d[4] || point.d[0],
          cy: point.d[5] || point.d[1],
          price: point.price,
          timeToDepartureDays: point.timeToDepartureDays
        };
      });
      highlightedPoints = dots.length;
      drawCanvas('visible', highlightId);
    } else {
      drawCanvas('visible');
    }

    const t = d3select(dotsG).transition().duration(300);

    d3select(dotsG).selectAll('.dot')
      .data(dots, (d) => d.id)
      .join(
        enter => enter.append('circle')
                  .call(enter => enter.transition(t).delay((d) => d.id * 7)
                    .attr('cx', (d) => +d.cx)
                    .attr('cy', (d) => +d.cy)),
        update => update
                    .call(enter => enter.transition(t)
                      .attr('cx', (d) => +d.cx)
                      .attr('cy', (d) => +d.cy)),
        exit => exit
                  .call(enter => enter.transition(t).delay((d) => (highlightedPoints - d.id) * 7)
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .remove())
      )
      .attr('class', 'dot')
      .attr('fill', '#321321')
      .attr('fill-opacity', 0.6)
      .attr('r', lineWidth * 1.1)
      .on('mouseover', (d) => setTooltip(d.price, d.timeToDepartureDays, d.cx, d.cy))
      .on('mouseout', (d) => setTooltip(null));

      dispatch('flightclick', highlightId);
  }

  function handleClick(e) {
    const col = hiddenCtx.getImageData(e.layerX * sf, e.layerY * sf, 1, 1).data;
    const colorId = `rgb(${col[0]},${col[1]},${col[2]})`;
    const flight = canvasData.find(elem => elem.colorId === colorId);
    if (flight) {
      highlightId = flight.id;
    } else {
      highlightId = null;
    }
  }

  function setTooltip(price, timeToDepartureDays = 0, x = 0, y = 0) {
    if (price === null) {
      tooltip = null;
      return;
    }

    const tooltipWidth = 150;
    const tooltipHeight = 50;
    tooltip = {
      textDays: `${timeToDepartureDays === 1 ? 'final price' : timeToDepartureDays + ' days to departure.'}`,
      textPrice: `${Math.round(price)} €`,
      x: Number(x) - tooltipWidth / 2,
      y: Number(y) + 10,
      width: tooltipWidth,
      height: tooltipHeight
    };
  }

  onMount(() => {
    canvas = d3select(canvasElement);
    ctx = canvas.node().getContext('2d');
    hiddenCanvas = d3select(hiddenCanvasElement);
    hiddenCtx = hiddenCanvas.node().getContext('2d');
  });

  $: width = width || 0;
  $: height = height || 0;

  $: if (width && height) setupCanvas();

  $: if (data && data.length > 0) {
    canvasData = renderColorGradients();
    drawCanvas('visible', highlightId);
    drawCanvas('hidden');
    if (!canvasData.map(elem => elem.id).includes(highlightId)) highlightId = null;
  }

  $: highlightFlight(highlightId);
</script>

<svelte:window on:click={() => {if (highlightId !== null) highlightId = null;}}/>

<svg width={width} height={height} on:click|stopPropagation={(e) => handleClick(e)}>
  <g class="circle-origin" transform="translate({width / 2} {height / 2})">
    <g bind:this={dotsG}></g>
    {#if tooltip}
      <g class="tooltip" transform="translate({tooltip.x} {tooltip.y})" transition:fade>
        <rect x="0" y="0" width={tooltip.width} height={tooltip.height} rx="6" ry="6"></rect>
        <text class="price" transform="translate({tooltip.width / 2} {tooltip.height * 0.4})">{tooltip.textPrice}</text>
        <text class="days" transform="translate({tooltip.width / 2} {tooltip.height * 0.75})">{tooltip.textDays}</text>
      </g>
    {/if}
  </g>
</svg>
<canvas class="visible" bind:this={canvasElement}></canvas>
<canvas class="hidden" bind:this={hiddenCanvasElement}></canvas>

<style>
  svg {
    position: absolute;
    z-index: 200;
  }

  g.tooltip rect {
    fill: #FFFFFF;
    fill-opacity: 1;
    stroke: var(--gray);
    stroke-width: 1;
    stroke-dasharray: 4;
  }

  g.tooltip text {
    fill: var(--gray);
    text-anchor: middle;
  }

  g.tooltip text.price {
    font-weight: bold;
  }

  g.tooltip text.days {
    font-size: 0.8rem;
  }

  canvas.visible {
    position: absolute;
    z-index: 100;
  }

  canvas.hidden {
    display: none;
    position: absolute;
    z-index: -1;
  }
</style>
