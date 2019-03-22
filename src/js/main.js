//= third_party/d3.min.js

document.addEventListener('DOMContentLoaded', function () {

  'use strict';

  const drawSlider = function(min, max) {

    let width = null;

    const sliderMargin = { top: 20, right: 100, bottom: 20, left: 100};

    const sliderHeight = 160 - sliderMargin.top - sliderMargin.bottom;

    const sliderContainer = d3.select('.slider-container')

    const svg = sliderContainer
        .append('svg')
        .attr('height', sliderHeight + sliderMargin.top + sliderMargin.bottom)
        // .call(responsivefy);

    const x = d3.scaleLinear()
        .domain([0, +svg.attr("width") - sliderMargin.left - sliderMargin.right])
        .range([min, max])
        .clamp(true);

    const slider = svg.append('g')
        .attr('transform', `translate(${sliderMargin.left}, ${ sliderHeight/2 + sliderMargin.top})`);

    const track = slider.append("line")
        .attr("class", "track")
        .attr("x1", x.domain()[0]);
        // .attr("x2", +svg.attr("width") - sliderMargin.left - sliderMargin.right);

    const activePeriod = slider.insert('line')
        .attr("class", "active")
        .attr("x1", 0);
        // .attr("x2", +svg.attr("width") - sliderMargin.left - sliderMargin.right)

    const handleMin = slider.insert("circle", ".track-overlay")
        .attr("class", "handle min")
        .attr("r", 14)
        .call(d3.drag()
            .on('drag', draggedPoint)
            .on('end', dispatchNewData));

    const handleMax = slider.insert("circle", ".track-overlay")
        .attr("class", "handle max")
        .attr('cx', +svg.attr("width") - sliderMargin.left - sliderMargin.right)
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
        .attr("x", +svg.attr("width") - sliderMargin.left - sliderMargin.right)
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
        .attr("x", +svg.attr("width") - sliderMargin.left - sliderMargin.right)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .text(millisToReadable(max));

    // Drag functions

    function draggedPoint() {
      const source = d3.select(this);
      const eventInfo = defineDragPosition(d3.event.x, source);
      const position = eventInfo.position;
      const isMin = eventInfo.isMin;
      source.attr('cx', position);
      if (isMin) {
        activePeriod.attr('x1', position);
        tooltipMin
            .attr('x', position)
            .text(eventInfo.date.readableFormat);
      } else {
        activePeriod.attr('x2', position);
        tooltipMax
            .attr('x', position)
            .text(eventInfo.date.readableFormat);
      }
      activePeriod.attr('x2') - activePeriod.attr('x1') < 150 ? tooltipMax.attr('y', 40) : tooltipMax.attr('y', -30);
    };

    function defineDragPosition(eventX, sourceObj) {
      const minPoint = sourceObj.classed('min');
      const min = minPoint ? 0 : handleMin.attr('cx');
      const max = minPoint ? handleMax.attr('cx') - handleMax.attr('r') * 2 : track.attr('x2');
      let position = +eventX;
      if (minPoint) {
        tickLeft.classed('visible', position > 100);
      } else {
        tickRight.classed('visible', max - position > 100);
      }
      if (eventX < min) {
        position = min;
      } else if (eventX > max) {
        position = +max;
      }
      const convertedDate = convertToDate(position);
      return { position: position, isMin: minPoint, date: convertedDate};
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
      const isMin = d.isMin;
      const position = d.position;
      isMin ? activePeriod.attr('x1', position) : activePeriod.attr('x2', position);
    };

    // Responsivefy function

    function responsivefy(svg) {
      const container = d3.select(svg.node().parentNode);
      svg.call(resize);
      d3.select(window).on("resize." + container.attr("id"), resize);
      function resize() {
        const bbox = container.node().getBoundingClientRect();
        width = bbox.width;
        svg.attr("width", width);
      }
    };

    function resize() {
      const container = d3.select(svg.node().parentNode);
      const width = container.node().getBoundingClientRect().width;
      const innerWidth = width - sliderMargin.left - sliderMargin.right;
      svg.attr("width", width);
      x.domain([0, innerWidth]);
      track.attr('x2', innerWidth);
      // handleMax.attr('cx', innerWidth);
      console.log(width);
    };

    resize();

    d3.select(window).on('resize', resize);

  };

  // const sliderContainer = d3.select('.slider-container')
  //
  // const svg = sliderContainer
  //     .append('svg')
  //     .attr('height', sliderHeight + sliderMargin.top + sliderMargin.bottom)
  //     .call(responsivefy);
  //
  // const x = d3.scaleLinear()
  //     .domain([0, 900])
  //     .range([new Date(2006, 0, 1), new Date(2007, 11, 31)])
  //     .clamp(true);
  //
  // const slider = svg
  //     .append('g')
  //     .attr('transform', `translate(${sliderMargin.left}, ${ sliderHeight/2 + sliderMargin.top})`);
  //
  // const track = slider.append("line")
  //     .attr("class", "track")
  //     .attr("x1", x.domain()[0])
  //     .attr("x2", +svg.attr("width") - sliderMargin.left - sliderMargin.right);
  //
  // const activePeriod = slider.insert('line')
  //     .attr("class", "active")
  //     .attr("x1", 0)
  //     .attr("x2", +svg.attr("width") - sliderMargin.left - sliderMargin.right);
  //
  // const handleMin = slider.insert("circle", ".track-overlay")
  //     .attr("class", "handle min")
  //     .attr("r", 14)
  //     .call(d3.drag()
  //         .on('drag', draggedPoint)
  //         .on('end', dispatchNewData));
  //
  // const handleMax = slider.insert("circle", ".track-overlay")
  //     .attr("class", "handle max")
  //     .attr('cx', +svg.attr("width") - sliderMargin.left - sliderMargin.right)
  //     .attr("r", 14)
  //     .call(d3.drag()
  //         .on('drag', draggedPoint)
  //         .on('end', dispatchNewData));
  //
  // const tooltipMin = slider.insert('text')
  //     .attr('class', 'handle-tooltip')
  //     .attr("x", 0)
  //     .attr("y", -30)
  //     .attr("text-anchor", "middle")
  //     .text('some text');
  //
  // const tooltipMax = slider.insert('text')
  //     .attr('class', 'handle-tooltip')
  //     .attr("x", +svg.attr("width") - sliderMargin.left - sliderMargin.right)
  //     .attr("y", -30)
  //     .attr("text-anchor", "middle")
  //     .text('some text');
  //
  // const tickLeft = slider.insert('text')
  //     .attr('class', 'tick-tooltip')
  //     .attr("x", 0)
  //     .attr("y", 40)
  //     .attr("text-anchor", "middle")
  //     .text('some text');
  //
  // const tickRight = slider.insert('text')
  //     .attr('class', 'tick-tooltip')
  //     .attr("x", +svg.attr("width") - sliderMargin.left - sliderMargin.right)
  //     .attr("y", 40)
  //     .attr("text-anchor", "middle")
  //     .text('some text');

  // Window resize function

  // d3.select(window).on('resize', resize);
  //
  // // get width of container and resize svg to fit it
  // function resize() {
  //
  //   Resizing the
  //
  //   const width =
  //
  //
  //   console.log('hello');
  //   // var targetWidth = parseInt(container.style("width"));
  //   // svg.attr("width", targetWidth);
  //   // svg.attr("height", Math.round(targetWidth / aspect));
  // }

  // function draggedPoint() {
  //   const source = d3.select(this);
  //   const eventInfo = defineDragPosition(d3.event.x, source);
  //   const position = eventInfo.position;
  //   const isMin = eventInfo.isMin;
  //   source.attr('cx', position);
  //   if (isMin) {
  //     activePeriod.attr('x1', position);
  //     tooltipMin
  //         .attr('x', position)
  //         .text(eventInfo.date.readableFormat);
  //   } else {
  //     activePeriod.attr('x2', position);
  //     tooltipMax
  //         .attr('x', position)
  //         .text(eventInfo.date.readableFormat);
  //   }
  //   activePeriod.attr('x2') - activePeriod.attr('x1') < 150 ? tooltipMax.attr('y', 40) : tooltipMax.attr('y', -30);
  // };

  // function defineDragPosition(eventX, sourceObj) {
  //   const minPoint = sourceObj.classed('min');
  //   const min = minPoint ? 0 : handleMin.attr('cx');
  //   const max = minPoint ? handleMax.attr('cx') - handleMax.attr('r') * 2 : track.attr('x2');
  //   let position = +eventX;
  //   if (minPoint) {
  //     tickLeft.classed('visible', position > 100);
  //   } else {
  //     tickRight.classed('visible', max - position > 100);
  //   }
  //   if (eventX < min) {
  //     position = min;
  //   } else if (eventX > max) {
  //     position = +max;
  //   }
  //   const convertedDate = convertToDate(position);
  //   return { position: position, isMin: minPoint, date: convertedDate};
  // };

  // Function that convert dragging position into new date

  // function convertToDate(position) {
  //   const dateInMillis = x(position).setHours(0,0,0,0);
  //   const options = { month: 'short', day: 'numeric', year: 'numeric' };
  //   const readable = new Intl.DateTimeFormat('en-US', options).format(dateInMillis);
  //   return { inMillis: dateInMillis, readableFormat: readable };
  // };

  // function responsivefy(svg) {
  //   const container = d3.select(svg.node().parentNode);
  //   console.log(sliderMargin);
  //   svg.call(resize);
  //   d3.select(window).on("resize." + container.attr("id"), resize);
  //   function resize() {
  //     const bbox = container.node().getBoundingClientRect();
  //     svg.attr("width", bbox.width);
  //     svg.select()
  //   }
  // };

  // Dispatching event

  // const dispatch = d3.dispatch('valueChanged');
  //
  // dispatch.on('valueChanged', filterValueChanged);
  //
  // function dispatchNewData() {
  //   const eventInfo = defineDragPosition(d3.event.x, d3.select(this));
  //   dispatch.call('valueChanged', null, eventInfo);
  // };
  //
  // function filterValueChanged(d) {
  //   const isMin = d.isMin;
  //   const position = d.position;
  //   isMin ? activePeriod.attr('x1', position) : activePeriod.attr('x2', position);
  // };

  drawSlider(new Date(2006, 0, 1), new Date(2007, 11, 31));

});
