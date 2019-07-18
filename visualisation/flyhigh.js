function createChart() {
  // general
  const pi2 = 2 * Math.PI;
  const pi1_2 = Math.PI / 2;
  const sf = 2;
  const lineColor = {
    high: '#EF6461',
    middle:'#E3D8F1',
    low: '#2274A5'
  };
  
  // the chart container
  let container = d3.select('#chart');
  let brushContainer = d3.select('#time-brush');

  // remove old stuff
  container.selectAll('canvas').remove();
  brushContainer.selectAll('svg').remove();
  container.style('height', null);
  brushContainer.style('height', null);
  
  // the window dimensions
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  // defining the visual dimensions
  const baseWidth = 500;
  const width = ww;

  const height = wh;

  const sizeFactor = width / baseWidth;

  const brushHeight = 100;
  const canvasHeight = height - brushHeight;

  // set the container to the calculated dimensions
  container.style('width', `${width}px`);
  container.style('height', `${canvasHeight}px`);
  brushContainer.style('width', `${width}px`);
  brushContainer.style('height', `${brushHeight}px`);

  // create canvas for the lines
  let canvas = container.append('canvas').attr('id', 'canvas-target');
  let ctx = canvas.node().getContext('2d');

  // make the canvas nice looking
  canvas
    .attr('width', sf * width)
    .attr('height', sf * (canvasHeight))
    .style('width', `${width}px`)
    .style('height', `${canvasHeight}px`);
  ctx.scale(sf, sf);
  ctx.translate(width / 2, canvasHeight / 2);

  // general settings
  ctx.globalCompositeOperation = 'color'; // darken, lighten, color
  ctx.lineCap = 'round';


  // read in the data
  const timeParser = (datetime) => {
    return d3.utcParse('%Y-%m-%dT%I:%M:%SZ')(datetime);
  }

  let dataCatch = Promise.all([
    d3.csv('./data/flights_by_day_to_departure.csv', (d) => {
      return {
        ...d,
        price: +d.price,
        timeToDepartureDays: +d.timeToDepartureDays,
        departure: timeParser(d.departure)
      };
    }),
    d3.csv('./data/flight_info.csv', (d) => {
      return {
        ...d,
        arrival: timeParser(d.arrival),
        departure: timeParser(d.departure),
        departureRounded: timeParser(d.departureRounded),
        meanPrice: +d.meanPrice,
        medianPrice: +d.medianPrice,
        sumPrice: +d.sumPrice,
        sdPrice: +d.sdPrice,
        endPrice: isNaN(+d.endPrice) ? 0 : +d.endPrice
      };
    })
  ]);
  
  dataCatch.then(data => {
    createVisuals(data);
  });

  function createVisuals(data) {
    const radialData = data[0];
    const flightInfo = data[1];
    
    const maxPrice = d3.max(radialData, d => d.price);

    let priceScale = d3.scaleLinear()
      .domain([0, maxPrice])
      .range([width / (sizeFactor * 15), Math.min(width, canvasHeight) * 0.5]);

    const daysToAngle = (days) => {
      return -pi2 * days / 30;
    }

    const line = d3.lineRadial()
      .angle(d => d.angle)
      .radius(d => d.radius)
      .curve(d3.curveBasis)
      .context(ctx);

    const nData = d3.nest()
      .key(d => d.flightIdUnique)
      .entries(radialData);

    const radialDataPreCalc = nData.map(priceLine => {
      let priceLineData = [];
      let endRadius = -100;
      priceLine.values.forEach(d => {
        const radius = priceScale(d.price);
        const angle = daysToAngle(d.timeToDepartureDays);
        if (d.timeToDepartureDays === 1) endRadius = radius;
        const point = {
          day: d.timeToDepartureDays,
          radius,
          angle
        };
        priceLineData.push(point);
      });

      const minRadius = Math.min(...priceLineData.map(elem => elem.radius));
      const maxRadius = Math.max(...priceLineData.map(elem => elem.radius));
      const middleStop = Math.min((endRadius - minRadius) / (maxRadius - minRadius), 1.0) || 0;

      let color;
      if (minRadius / maxRadius >= 0.9) {
        color = '#E3D8F1';
      } else {
        color = ctx.createRadialGradient(0, 0, minRadius, 0, 0, maxRadius);
        color.addColorStop(0, lineColor.low);
        color.addColorStop(middleStop, lineColor.middle);
        color.addColorStop(1, lineColor.high);
      }

      return {
        priceLineData,
        minRadius,
        maxRadius,
        endRadius,
        middleStop,
        color,
        departure: priceLine.values[0].departure
      };
    });

    drawRadialChartAnnotation();

    drawTimeBrush(flightInfo, radialDataPreCalc);

    function drawRadialChartAnnotation() {
      let annotation = container.append('svg')
        .attr('class', 'radial-chart-annotation')
        .style('width', width)
        .style('height', canvasHeight);

      const ticks = [30, 20, 10, 1].map(tick => {
        const radius = priceScale(6000);
        const angle = daysToAngle(tick) * 360 / pi2 + 360 - 90;
        return {
          xOffset: width / 2 + (Math.cos(angle) * radius),
          yOffset: canvasHeight / 2 + (Math.sin(angle) * radius),
          angle,
          text: tick
        }
      });

      annotation.selectAll('g')
        .data(ticks)
        .enter().append('g')
        .attr('class', 'radial-tick')
        .attr('transform', d => (
          `translate(${d.xOffset} ${d.yOffset})
           rotate(${d.angle})`))
        .append('text').text(d => d.text);
    }

    function drawCanvas(data) {
      ctx.clearRect(-width / 2, -height / 2, width, height);
      ctx.globalAlpha = 0.6;
      data.forEach(d => {
        ctx.beginPath();
        line(d.priceLineData);
        ctx.lineWidth = sizeFactor;
        ctx.strokeStyle = d.color;
        ctx.stroke();
      });
    }

    function drawTimeBrush(flightInfo, radialData) {
      const padding = {
        top: 20
      };
      const maxAnimate = 300;
      let isInit = true;

      const formatTime = d3.timeFormat('%Y-%m-%d');
      let radialDataIndex = {};
      radialData.forEach((d, index, arr) => {
        const departure = formatTime(d.departure);
        if (!Object.keys(radialDataIndex).includes(departure)) {
          radialDataIndex[departure] = [index];
        } else {
          radialDataIndex[departure] = [radialDataIndex[departure][0], index];
        }
      });

      let svg = brushContainer.append('svg')
        .attr('id','departure-brush')
        .attr('width', width)
        .attr('height', brushHeight);

      let graph = svg.append('g');

      let x = d3.scaleTime()
        .domain(d3.extent(flightInfo, d => d.departure))
        .range([0, width]);

      let xAxis = svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${padding.top})`)
        .call(d3.axisTop(x)
          .ticks(7))
      
      xAxis.selectAll('path')
        .style('display', 'none');

      xAxis.selectAll('text')
        .attr('fill', '#777');

      xAxis.selectAll('line')
        .attr('stroke', '#777')
        .attr('transform', 'translate(0 2)');

      let yGenerator = (category) => d3.scaleLinear()
        .domain([0, d3.max(flightInfo, d => d[category])])
        .range([brushHeight, padding.top]);
      
      const area = (category) => d3.area()
        .x(d => x(d.departure))
        .y0(yGenerator(category)(0))
        .y1(d => yGenerator(category)(d[category]))
        .curve(d3.curveBasis);

      graph.selectAll('.path-end-price')
        .data([flightInfo])
        .enter().append('path')
        .attr('d', area('endPrice'))
        .attr('fill', lineColor.middle)
        .attr('fill-opacity', 1);

      const brush = d3.brushX()
        .extent([[0, 0], [width, brushHeight]])
        .on('brush end', brushed);

      let brusher = svg.append('g')
        .attr('class', 'brush')
        .call(brush)
        .call(brush.move,
          [
            x(timeParser('2019-07-11T00:00:00Z')),
            x(timeParser('2019-07-14T00:00:00Z'))
          ]);

      brusher
        .selectAll('rect.selection')
        .attr('fill', lineColor.low);

      function brushed() {
        if (!isInit && !d3.event.sourceEvent || !d3.event.selection) return;

        isInit = false;

        const selectionX = d3.event.selection;
        let selectionTime = selectionX.map(x.invert);
        let selectionTimeRounded = selectionTime.map(d3.timeDay.round);

        if (selectionTimeRounded[0] >= selectionTimeRounded[1]) {
          selectionTimeRounded[0] = d3.timeDay.floor(selectionTime[0]);
          selectionTimeRounded[1] = d3.timeDay.offset(selectionTimeRounded[0]);
        }

        if (d3.event.type === 'end') {
          d3.select(this).transition().call(d3.event.target.move, selectionTimeRounded.map(x));
        }
        
        selectionTime = selectionTimeRounded.map(formatTime);

        const start = radialDataIndex[selectionTime[0]][0];
        const stop = radialDataIndex[selectionTime[1]][1];
        if (Math.abs(stop - start) <= maxAnimate || d3.event.type === 'end') {
          drawCanvas(radialData.slice(start, stop + 1));
        }
      }
    }
  }
}
