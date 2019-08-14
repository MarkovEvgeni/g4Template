function sliderChart() {

  let data = null;

  let updateData;

  let min;
  let max;
  let currentMin;
  let currentMax;

  let externalCallback;

  const sliderMargin = { top: 20, right: 100, bottom: 20, left: 100};
  const sliderHeight = 160 - sliderMargin.top - sliderMargin.bottom;
  let sliderContainer;

  // Responsivefy function

  function responsivefy(svg, scaleLinear) {
    let innerWidth;
    const container = d3.select(svg.node().parentNode);
    svg.call(resize);
    d3.select(window).on("resize." + container.attr("id"), resize);
    scaleLinear.domain([0, innerWidth]);

    function resize() {
      const bbox = container.node().getBoundingClientRect();
      const width = bbox.width;
      innerWidth = width - sliderMargin.left - sliderMargin.right;
      scaleLinear.domain([0, innerWidth]);
      svg.attr("width", width);
    }
  };

  function slider(selection) {

    selection.each(function () {

      min = currentMin = data.min;
      max = currentMax = data.max;

      sliderContainer = d3.select(this);

      const x = d3.scaleLinear()
        .range([min, max])
        .clamp(true);

      const svg = sliderContainer
        .append('svg')
        .attr('height', sliderHeight + sliderMargin.top + sliderMargin.bottom)
        .call(responsivefy, x);

      const slider = svg.append('g')
        .attr('transform', `translate(${sliderMargin.left}, ${ sliderHeight/2 + sliderMargin.top})`);

      const track = slider.append("line")
        .attr("class", "track")
        .attr("x1", 0)
        .attr("x2", x.domain()[1]);

      const activePeriod = slider.insert('line')
        .attr("class", "active")
        .attr("x1", 0)
        .attr("x2", x.domain()[1]);

      const handleMin = slider.insert("circle", ".track-overlay")
        .attr("class", "handle min")
        .attr("r", 14)
        .call(d3.drag()
          .on('drag', draggedPoint)
          .on('end', dispatchNewData));

      const handleMax = slider.insert("circle", ".track-overlay")
        .attr("class", "handle max")
        .attr('cx', x.domain()[1])
        .attr("r", 14)
        .call(d3.drag()
          .on('drag', draggedPoint)
          .on('end', dispatchNewData));

      const tooltipMin = slider.insert('text')
        .attr('class', 'handle-tooltip')
        .attr("x", 0)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .text(millisToReadable(min));

      const tooltipMax = slider.insert('text')
        .attr('class', 'handle-tooltip')
        .attr("x", x.domain()[1])
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .text(millisToReadable(max));

      const tickLeft = slider.insert('text')
        .attr('class', 'tick-tooltip')
        .attr("x", 0)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .text(millisToReadable(min));

      const tickRight = slider.insert('text')
        .attr('class', 'tick-tooltip')
        .attr("x", x.domain()[1])
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .text(millisToReadable(max))
        .call(resizeVisualParts, tickLeft, x, track, handleMin, handleMax, tooltipMin, tooltipMax, activePeriod);

      // Drag functions

      function draggedPoint() {
        const source = d3.select(this);
        const eventInfo = defineDragPosition(d3.event.x, source);
        const position = eventInfo.position;
        const isMin = eventInfo.isMin;
        source.attr('cx', position);
        if (isMin) {
          activePeriod.attr('x1', position);
          currentMin = eventInfo.date.inMillis;
          tooltipMin
            .attr('x', position)
            .text(eventInfo.date.readableFormat);
        } else {
          activePeriod.attr('x2', position);
          currentMax = eventInfo.date.inMillis;
          tooltipMax
            .attr('x', position)
            .text(eventInfo.date.readableFormat);
        }
        defineTipsVisibility(activePeriod, tickLeft, tickRight, tooltipMax, x.domain()[1]);
      };

      function defineDragPosition(eventX, sourceObj) {
        const minPoint = sourceObj.classed('min');
        const min = minPoint ? 0 : handleMin.attr('cx');
        const max = minPoint ? handleMax.attr('cx') - handleMax.attr('r') * 2 : x.domain()[1];
        let position = +eventX;
        if (eventX < min) {
          position = min;
        } else if (eventX > max) {
          position = +max;
        };
        const convertedDate = convertToDate(position);
        return { position: position, isMin: minPoint, date: convertedDate};
      };

      function defineTipsVisibility(activePeriod, leftEdge, rightEdge, tooltipMax, maxValue) {
        const fromValue = activePeriod.attr('x1');
        const toValue = activePeriod.attr('x2');
        leftEdge.classed('visible', fromValue > 100);
        rightEdge.classed('visible', maxValue - toValue > 100);
        toValue - fromValue < 150 ? tooltipMax.attr('y', 40) : tooltipMax.attr('y', -30);
      };

      function adjustHandlersPosition(linearScale, value) {
        const position = linearScale.invert(value);
        return position;
      };

      // Function that convert dragging position into new date

      function convertToDate(position) {
        const dateInMillis = x(position).setHours(0,0,0,0);
        return { inMillis: dateInMillis, readableFormat: millisToReadable(dateInMillis) };
      };

      function millisToReadable(mil) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const readable = new Intl.DateTimeFormat('en-US', options).format(mil);
        return readable;
      };

      // Dispatching event

      const dispatch = d3.dispatch('valueChanged');

      dispatch.on('valueChanged', filterValueChanged);

      function dispatchNewData() {
        const eventInfo = defineDragPosition(d3.event.x, d3.select(this));
        dispatch.call('valueChanged', null, eventInfo);
      };

      function filterValueChanged(d) {
        if (typeof externalCallback === 'function') externalCallback(d.isMin, d.date.inMillis);
        const isMin = d.isMin;
        const position = d.position;
        isMin ? activePeriod.attr('x1', position) : activePeriod.attr('x2', position);
      };

      function resizeVisualParts(rightTick, leftTick, linearScale, track, handleMin, handleMax, minTip, maxTip, active) {
        d3.select(window).on("resize." + new Date().getTime(), resize);
        function resize() {
          const rightEdge = linearScale.domain()[1];
          const minPosition = adjustHandlersPosition(linearScale, currentMin);
          const maxPosition = adjustHandlersPosition(linearScale, currentMax);
          rightTick.attr('x', rightEdge);
          track.attr('x2', rightEdge);
          handleMin.attr('cx', minPosition);
          handleMax.attr('cx', maxPosition);
          minTip.attr('x', minPosition);
          maxTip.attr('x', maxPosition);
          active
            .attr('x1', minPosition)
            .attr('x2', maxPosition);
          defineTipsVisibility(active, leftTick, rightTick, maxTip, rightEdge);
        };
      };

      updateData = function() {

        min = currentMin = data.min;
        max = currentMax = data.max;

        x.range([min, max]);

        track
          .attr("x1", 0)
          .attr("x2", x.domain()[1]);

        activePeriod
          .attr("x1", 0)
          .attr("x2", x.domain()[1]);

        handleMin
          .attr('cx', 0);

        handleMax
          .attr('cx', x.domain()[1]);

        tooltipMin
          .attr("x", 0)
          .text(millisToReadable(min));

        tooltipMax
          .attr("x", x.domain()[1])
          .attr("y", -30)
          .text(millisToReadable(max));

        tickLeft
          .attr("x", 0)
          .classed('visible', false)
          .text(millisToReadable(min));

        tickRight
          .attr("x", x.domain()[1])
          .classed('visible', false)
          .text(millisToReadable(max));

      }

    });

  }

  slider.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    if (typeof updateData === 'function') updateData();
    return slider;
  };

  slider.filter = function(value) {
    externalCallback = value;
  };

  return slider;
}
