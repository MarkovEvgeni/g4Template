 function barChart() {

    let data = [];
    let updateData;

    let margin = { top: 50, right: 75, bottom: 50, left: 75 };
    let fullWidth = 900;
    let fullHeight = 400;
    let width = fullWidth - margin.left - margin.right;
    let height = fullHeight - margin.top - margin.bottom;

    let trans = d3.transition().duration(500);

    function responsivefy(svg) {

        const container = d3.select(svg.node().parentNode),
          initWidth = parseInt(svg.style("width")),
          initHeight = parseInt(svg.style("height")),
          aspect = initWidth / initHeight;

        svg.attr("viewBox", "0 0 " + initWidth + " " + initHeight)
          .attr("preserveAspectRatio", "xMinYMid")
          .call(resize);

        d3.select(window).on("resize." + container.attr("id"), resize);

        function resize() {
          const targetWidth = parseInt(container.style("width"));
          const targetHeight = Math.round(targetWidth / aspect);
          svg.attr("width", targetWidth);
          svg.attr("height", targetHeight);
        }
    }

    function chart(selection) {

      selection.each(function () {

        let xScale = d3.scaleBand()
          .padding(0.2);

        let xScale2 = d3.scaleTime();

        let yScale1 = d3.scaleLinear();

        let yScale2 = d3.scaleLinear();

        const svg = d3.select(this)
          .append('svg')
            .attr('width', fullWidth)
            .attr('height', fullHeight)
          .call(responsivefy);

        const charts = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // No data to show

       const noData = d3.select(this)
           .append('div')
           .attr('class', 'no-data')
           .html('No data to show');

        // Left axis

        yScale1.domain([0, d3.max(data, d => d.flights)])
          .range([height, 0]);

        let yAxis1 = svg.append('g')
            .call(d3.axisLeft(yScale1))
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        // Labels
          svg.append("text")
              .attr("class", "y label")
              .attr("text-anchor", "end")
              .attr("y", 6)
              .attr("dy", ".75em")
              .attr("transform", `rotate(-90) translate(-${margin.top}, ${margin.left})`)
              .text("flights");

          svg.append("text")
              .attr("class", "y2 label")
              .attr("text-anchor", "end")
              .attr("y", width)
              .attr("dy", ".75em")
              .attr("transform", `rotate(-90) translate(-${margin.top}, ${margin.left - 15})`)
              .text("minutes");

        // Right axis

        yScale2.domain([0, d3.max(data, d => d.totalDelay)])
          .range([height, 0]);

        let yAxis2 = svg.append('g')
            .attr('transform', `translate(${width + margin.left}, ${margin.top})`)
            .call(d3.axisRight(yScale2));

        // Bottom axis

        xScale.domain(data.map(d => d.date))
          .range([0, width]);

        xScale2.domain([+d3.min(data, d => d.date) - 43200000, +d3.max(data, d => d.date) + 43200000])
          .range([0, width]);

        let xAxis = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
            .call(d3.axisBottom(xScale2).ticks(5));

        // Tooltip for the line chart

        const lineTooltip = d3.select(this)
          .append('div')
          .attr('class', 'line-chart-tooltip')
          .style('left', 0)
          .style('top', 0)
          .style('transform', 'translateX(-50%) translateY(-120%)');

        const lineTooltipHeader = lineTooltip
          .append('p')
          .html('Date:');

        const lineTooltipDateValue = lineTooltip
          .append('p');

        const lineTooltipValueHeader = lineTooltip
          .append('p');

        const lineTooltipValueData = lineTooltip
          .append('p');

        // Tooltip for the bart chart

        const barTooltip = d3.tip()
            .attr('class', 'bar-chart-tooltip')
            .offset([-10, 0])
            .html(d => `<strong>Flights: </strong> <span>${d.flights}</span>`);

        svg.call(barTooltip);

        // Column chart diagram

        const barDiagram = charts.append('g')
          .attr("data-legend", 'Total flights')
          .attr('class', 'bar-diagram');

        barDiagram
          .selectAll('rect.bar')
          .data(data, d => d.date)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('y', height)
          .attr('height', 0)
          .attr('x', d => xScale(d.date))
          .attr('width', () => xScale.bandwidth())
          .on("mouseover", barTooltip.show)
          .on("mouseout", barTooltip.hide)
          .transition(trans)
          .delay(500)
          .attr('y', d => yScale1(d.flights))
          .attr('height', d => height - yScale1(d.flights));

        // Line chart diagram

        const chartDiagram = charts.append('g')
            .attr('class', 'chart-diagram');

        const line = d3.line()
            .x(d => xScale(d.date) + xScale.bandwidth() / 2)
            .y(d => yScale2(d.value))
            .curve(d3.curveLinear);

        let totalDelays = data.map(d => {
            return {value: d.totalDelay, date: d.date}
        });

        let totalFlights = data.reduce((sum, current) => {
            return sum + current.flights;
        }, 0);

        if (!totalFlights) {
            noData.classed('visible', true);
        } else {
            noData.classed('visible', false);
        }

        let carrierDelays = data.map(d => {
            return {value: d.carrierDelay, date: d.date}
        });

        let preparedData = [{path: totalDelays, name: 'Total delays, min'}, {path: carrierDelays, name: 'Carrier delays, min'}];

        chartDiagram.selectAll('.line')
            .data(preparedData, d => d.path.reduce((acc, cv) => {
                return acc + cv.value
            }, 0))
            .enter()
            .append('path')
            .attr("data-legend", d => d.name)
            .attr("data-path", d => d.path)
            .attr('class', 'line total-delay')
            .on("mouseover", lineHover)
            .on("mousemove", lineHover)
            .on("mouseleave", lineBlur)
            .style('stroke-width', '0px')
            .transition(trans)
            .delay(500)
            .style('stroke-width', '2px')
            .attr('d', d => line(d.path));

        // Legend

        const dataLegend = [];
        svg.selectAll("[data-legend]")._groups[0].forEach(nodeItem => {
          dataLegend.push({'name': nodeItem.dataset.legend});
        });

        const legend = d3.select(this)
          .append('svg')
          .attr('class', 'legend')
          .attr('width', 300)
          .attr('height', 150)
          .selectAll('g.legend-line')
          .data(dataLegend, d => d.name)
          .enter()
          .append('g')
          .attr('class', 'legend-line')
          .attr("transform", (d, i) => "translate(0," + i * 50 + ")")
          .on('click', legItemClicked);

          legend.append('circle')
            .attr('class', 'legend-circle')
            .attr('r', 15)
            .attr('cy', 25)
            .attr('cx', 30);

          legend.append('text')
              .attr("x", 60)
              .attr("y", 30)
              .attr("fill", 'black')
              .attr('class', 'legend-text')
              .text(d => d.name)
              .style("text-anchor", "start");

          // Dispatching click on legend item

          function legItemClicked(data, index, array) {
            array[index].classList.toggle('less-visible');
            svg.selectAll(`[data-legend='${data.name}']`)._groups[0][0].classList.toggle('hidden');
          }

          function lineHover() {
            const currentWidth = d3.select(this).node().parentNode.getBoundingClientRect().width;
            const svgWidth = d3.select(this).node().closest('svg').getBoundingClientRect().width;
            const converterValue = currentWidth / width;
            const date = xScale2.invert((d3.event.offsetX - (svgWidth - currentWidth) / 2) / converterValue).setHours(12,0,0,0);
            const data = d3.select(this).data()[0].path.filter(item => item.date.getTime() === date);
            const headingValue = d3.select(this).data()[0].name;
            const value = data.length ? data[0].value + ' min' : 'No data';
            const readableDate = millisToReadable(date);
            lineTooltip.node().classList.add('visible');
            defineLineTooltip(readableDate, headingValue, value, d3.event.offsetX + 'px', d3.event.offsetY + 'px');
          }

          function lineBlur() {
            lineTooltip.node().classList.remove('visible');
          }

          function defineLineTooltip(date, valueHeading, value, xPos, yPos) {
            lineTooltipDateValue.html(date);
            lineTooltipValueHeader.html(`${valueHeading}:`);
            lineTooltipValueData.html(value);
            lineTooltip.style('left', xPos);
            lineTooltip.style('top', yPos);
          }

          function millisToReadable(mil) {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            const readable = new Intl.DateTimeFormat('en-US', options).format(mil);
            return readable;
          }

          updateData = function() {

              // Updating axes

              yScale1.domain([0, d3.max(data, d => d.flights)]);

              yAxis1.transition(trans)
                  .delay(1000)
                  .call(d3.axisLeft(yScale1));

              yScale2.domain([0, d3.max(data, d => d.totalDelay)]);

              yAxis2.transition(trans)
                  .delay(1000)
                  .call(d3.axisRight(yScale2));

              xScale.domain(data.map(d => d.date));

              xScale2.domain([d3.min(data, d => d.date), d3.max(data, d => d.date)]);

              xAxis.transition(trans)
                  .delay(1000)
                  .call(d3.axisBottom(xScale2).ticks(5).tickFormat(d3.timeFormat("%d %b")));

              let totalFlights = data.reduce((sum, current) => {
                  return sum + current.flights;
              }, 0);

              if (!totalFlights) {
                  noData.classed('visible', true);
              } else {
                  noData.classed('visible', false);
              }

              // Updating column diagram

              const bars = barDiagram
                  .selectAll('rect.bar')
                  .data(data, d =>  d.date);

              // Old presented elements
              bars
                .transition(trans)
                .delay(0)
                .attr('y', height)
                .attr('height', 0)
                .transition()
                .delay(0)
                .attr('x', d => xScale(d.date))
                .attr('width', () => xScale.bandwidth())
                .transition(trans)
                .delay(0)
                .attr('y', d => yScale1(d.flights))
                .attr('height', d => height - yScale1(d.flights));

              // New bars
              bars.enter()
                  .append('rect')
                  .attr('y', height)
                  .attr('height', 0)
                  .attr('class', 'bar')
                  .attr('x', d => xScale(d.date))
                  .attr('width', () => xScale.bandwidth())
                  .on("mouseover", barTooltip.show)
                  .on("mouseout", barTooltip.hide)
                  .transition(trans)
                  .delay(bars.exit().size() ? 1000 : 500)
                  .attr('y', d => yScale1(d.flights))
                  .attr('height', d => height - yScale1(d.flights));

              // Old bars not presented in new data
              bars.exit()
                  .transition(trans)
                  .delay(0)
                  .attr('y', height)
                  .attr('height', 0)
                  .remove();

              // Updating line diagram

              let totalDelays = data.map(d => {
                  return {value: d.totalDelay, date: d.date}
              });

              let carrierDelays = data.map(d => {
                  return {value: d.carrierDelay, date: d.date}
              });

            let preparedData = [{path: totalDelays, name: 'Total delays'}, {path: carrierDelays, name: 'Carrier delays'}];

              const totalLine = chartDiagram.selectAll('.line')
                .data(preparedData, d => d.path.reduce((acc, cv) => {
                  return acc + cv.value
                }, 0));

              if (totalDelays.length === 1) {
                totalLine
                  .enter()
                  .append('line')
                  .attr('class', 'line total-delay')
                  .on("mouseover", lineHover)
                  .on("mousemove", lineHover)
                  .on("mouseleave", lineBlur)
                  .style('stroke-width', '0px')
                  .attr('x1', 0)
                  .attr('y1', d => yScale2(d.path[0].value))
                  .attr('x2', width)
                  .attr('y2', d => yScale2(d.path[0].value))
                  .transition(trans)
                  .delay(totalLine.exit().size() ? 500 : 0)
                  .style('stroke-width', '2px')
              }

              totalLine.enter()
                .append('path')
                .attr('class', 'line total-delay')
                .attr("data-legend", d =>  d.name)
                .on("mouseover", lineHover)
                .on("mousemove", lineHover)
                .on("mouseleave", lineBlur)
                .style('stroke-width', '0px')
                .transition(trans)
                .delay(totalLine.exit().size() ? 500 : 0)
                .style('stroke-width', '2px')
                .attr('d', d => line(d.path));

              totalLine
                .style('stroke-width', '0px')
                .transition(trans)
                .delay(500)
                .style('stroke-width', '2px')
                .attr('d', d => line(d.path));

              totalLine.exit()
                .transition(trans)
                .style('stroke-width', '0px')
                .remove();
          }

        });
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    return chart;

};
