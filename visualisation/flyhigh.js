function createChart() {

  // general
  const pi2 = 2 * Math.PI;
  const sf = 2;
  
  // the chart container
  let container = d3.select('#chart');
  
  // the window dimensions
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  // defining the visual dimensions
  const baseWidth = 1600;
  let width;
  if (wh < ww) {
    width = wh / 0.7;
  } else {
    if (ww < 500) width = ww / 0.5;
    else if (ww < 600) width = ww / 0.6;
    else if (ww < 800) width = ww / 0.7;
    else if (ww < 1100) width = ww / 0.8;
    else width = ww / 0.8;
  }

  width = Math.round(Math.min(baseWidth, width));
  const height = width;

  const sizeFactor = width / baseWidth;

  // set the container to the calculated dimensions
  container.style('width', `${width}px`);
  container.style('height', `${height}px`);

  // create canvas for the lines
  let canvas = container.append('canvas').attr('id', 'canvas-target');
  let ctx = canvas.node().getContext('2d');

  // make the canvas nice looking
  canvas
    .attr('width', sf * width)
    .attr('height', sf * height)
    .style('width', `${width}px`)
    .style('height', `${height}px`);
  ctx.scale(sf, sf);
  ctx.translate(width / 2, height / 2);

  // general settings
  ctx.globalCompositeOperation = 'color'; // darken, lighten, color
  ctx.lineCap = 'round';


  // read in the data
  d3.csv('./data/flights_by_day_to_departure.csv')
    .then(data => {
      drawCanvas(data);
    });

  function drawCanvas(data) {
    ctx.clearRect(-width / 2, -height / 2, width, height);

    let priceScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d.price))])
      .range([0, width / 2]);

    let line = d3.lineRadial()
      .angle(d => d.angle)
      .radius(d => d.radius)
      .curve(d3.curveCatmullRom)
      .context(ctx);

    const nData = d3.nest()
      .key(d => d.flightIdUnique)
      .entries(data);

    ctx.globalAlpha = 0.7;

    nData.forEach((priceLine) => {
      let priceLineData = [];
      priceLine.values.forEach(d => {
        const start = {
          day: Number(d.timeToDepartureDays),
          radius: priceScale(d.price),
          angle: -pi2 * (Number(d.timeToDepartureDays) - 1) / (30 * 1.15)
        };
        priceLineData.push(start);
      });
      
      const minRadius = Math.min(...priceLineData.map(elem => elem.radius));
      const maxRadius = Math.max(...priceLineData.map(elem => elem.radius));
      const endRadius = priceLineData.filter(v => v.day === 1)[0].radius;
      
      let color;
      if (maxRadius - minRadius <= 0.0) {
        color = '#E3D8F1';
      } else {
        color = ctx.createRadialGradient(0, 0, minRadius, 0, 0, maxRadius);
        const middleStop = Math.min((endRadius - minRadius) / (maxRadius - minRadius), 1.0);
        color.addColorStop(0, '#2274A5');
        color.addColorStop(middleStop, '#E3D8F1');
        color.addColorStop(1, '#EF6461');
      }

      ctx.beginPath();
      line(priceLineData);
      ctx.lineWidth = 2 * sizeFactor;
      ctx.strokeStyle = color;
      ctx.stroke();
    });

    // draw white circles
    // ctx.globalAlpha = 1.0;
    // ctx.beginPath();
    // ctx.arc(0, 0, priceScale(4419), 0, pi2);
    // ctx.strokeStyle = 'green';
    // ctx.stroke();
    
  }
}
