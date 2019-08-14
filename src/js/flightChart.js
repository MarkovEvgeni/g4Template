//= ../../node_modules/topojson/dist/topojson.min.js
//= ../../node_modules/d3-composite-projections/d3-composite-projections.min.js

function flightChart() {

    let data = {
        us: [],
        airports: [],
        flights: []
    };
    let updateData;
    let airportCoordinates = [];
    let activeAirports;
    let margin = { top: 50, right: 50, bottom: 50, left: 50 };
    let width = 960 - margin.left - margin.right;
    let height = 500 - margin.top - margin.bottom;
    let showFlights = false;
    let selectState;

    let trans = d3.transition().duration(500);

    const projection = d3.geoAlbersUsaTerritories()
        .scale(1000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath()
        .projection(projection);

    function filterActiveAirports() {
        activeAirports = [];
        data.flights.forEach((flight) => {
            if (activeAirports.indexOf(flight.Origin) == -1) {
                activeAirports.push(flight.Origin);
            }
            if (activeAirports.indexOf(flight.Dest) == -1) {
                activeAirports.push(flight.Dest);
            }
        });
    }

    function updateAirportsData() {
        return data.airports.filter(airport => {
            return activeAirports.indexOf(airport.iata) !== -1;
        }).map(function(airport) {
            const projectionTranslate = projection([airport.long, airport.lat]);
            airport.translate = projectionTranslate;
            airportCoordinates[airport.iata] = projectionTranslate;
            return airport;
        });
    }

    function updateFlightsData() {
        return data.flights.map(function(flight) {
            flight.startingPoint = airportCoordinates[flight.Origin];
            flight.destinationPoint = airportCoordinates[flight.Dest];
            return flight;
        });
    }

    function responsivefy(svg) {

        const container = d3.select(svg.node().parentNode),
            width = parseInt(svg.style("width")),
            height = parseInt(svg.style("height")),
            aspect = width / height;

        svg.attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMinYMid")
            .call(resize);

        d3.select(window).on("resize." + container.attr("id"), resize);

        function resize() {
            const targetWidth = parseInt(container.style("width"));
            svg.attr("width", targetWidth);
            svg.attr("height", Math.round(targetWidth / aspect));
        }
    }

    function chart(selection) {

        selection.each(function() {

            const svg = d3.select(this)
                .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                .call(responsivefy)
                .append('g')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`);

            const usMap = svg.append("g")
                .attr('class', 'states')
                .selectAll("path")
                .data(topojson.feature(data.us, data.us.objects.states).features)
                .enter().append("path")
                .attr("d", path)
                .attr("class", "state")
                .on("click", toggleStateSelection);

            const flightPaths = svg.append('g')
                .attr('class', 'flights');

            flightPaths
                .append('defs')
                .append('marker')
                .attr('id', 'triangle')
                .attr('viewBox', "0 0 6 6")
                .attr('markerUnits', 'strokeWidth')
                .attr('refX', '6')
                .attr('refY', '3')
                .attr('markerWidth', '6')
                .attr('markerHeight', '6')
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M 0 0 L 6 3 L 0 6 z')
                .attr('fill', '#ff0');

            const airports = svg.append('g')
                .attr('class', 'airports');

            filterActiveAirports();

            const updatedAirports = updateAirportsData();

            const flights =  showFlights ? updateFlightsData() : [];

            flightPaths.selectAll("line.flight")
                .data(flights, (flight) => {return `${flight.Origin}${flight.Year}${flight.DayofMonth}${flight.DayOfWeek}${flight.CRSDepTime}${flight.Dest}`})
                .enter()
                .append("line")
                .attr("class", "flight")
                .attr("x1", function(d) {
                    if (d.startingPoint) return d.startingPoint[0];
                })
                .attr("y1", function(d) {
                    if (d.startingPoint) return d.startingPoint[1];
                })
                .attr("x2", function(d) {
                    if (d.startingPoint) return d.destinationPoint[0];
                })
                .attr("y2", function(d) {
                    if (d.startingPoint) return d.destinationPoint[1];
                })
                .on("mouseover", flightHover)
                .on("mouseout", flightBlur)
                .style('stroke-opacity', 0)
                .transition(trans)
                .delay(500)
                .style('stroke-opacity', 1)
                .attr('marker-end', 'url(#triangle)');

            airports.selectAll("circle.airport")
                .data(updatedAirports, airport => airport.airport)
                .enter()
                .append("circle")
                .on("mouseover", airportHover)
                .on("mouseout", airportBlur)
                .attr("class", "airport")
                .attr('cx', function(d) {
                    var cxMove = projection([+d.long, +d.lat]);
                    if (cxMove) return cxMove[0];
                })
                .attr('cy', function(d) {
                    var cyMove = projection([+d.long, +d.lat]);
                    if (cyMove) return cyMove[1];
                })
                .transition(trans)
                .attr('r', 0)
                .attr('r', 3);

            // Tooltip for the line chart

            const airportTooltip = d3.select(this)
                .append('div')
                .attr('class', 'airport-chart-tooltip')
                .style('left', 0)
                .style('top', 0)
                .style('transform', 'translateX(-50%) translateY(-170%)');

            const airportTooltipTitle = airportTooltip
                .append('span')
                .append('p');

            const flightTooltip = d3.select(this)
                .append('div')
                .attr('class', 'flight-chart-tooltip')
                .style('left', 0)
                .style('top', 0)
                .style('transform', 'translateX(-50%) translateY(-120%)');

            const flightToolitipTitle = flightTooltip
                .append('p');

            function airportHover(airport) {
                airportTooltip.node().classList.add('visible');
                const xPos = d3.event.offsetX + 'px';
                const yPos = d3.event.offsetY + 'px';
                airportTooltip.style('left', xPos);
                airportTooltip.style('top', yPos);
                defineAirportTooltip(airport.city, airport.iata);
            }

            function airportBlur() {
                airportTooltip.node().classList.remove('visible');
            }

            function flightHover(flight) {
                flightTooltip.node().classList.add('visible');
                const xPos = d3.event.offsetX + 'px';
                const yPos = d3.event.offsetY + 'px';
                flightTooltip.style('left', xPos);
                flightTooltip.style('top', yPos);
                defineFlightTooltip(flight.Origin, flight.Dest, flight.Year, flight.Month, flight.DayofMonth, flight.FlightNum);
            }

            function flightBlur() {
                flightTooltip.node().classList.remove('visible');
            }

            function toggleStateSelection(state, index, usArray) {
                usArray[index].classList.toggle('active');
                if (typeof selectState === 'function') {
                    selectState(state.id);
                }
            }

            function defineAirportTooltip(city, iata) {
                airportTooltipTitle.html(city + ', ' + iata);
            }

            function defineFlightTooltip(from, to, year, month, day, number) {
                flightToolitipTitle.html(`#${number}: ${from} &#x2192; ${to} ${day}.${month}.${year}`);
            }

            updateData = function() {

                filterActiveAirports();

                const updatedAirports = updateAirportsData();

                const flights = showFlights ? updateFlightsData() : [];

                const flightsNewData = flightPaths.selectAll("line.flight")
                    .data(flights, (flight) => {
                        return `${flight.Origin}${flight.Year}${flight.DayofMonth}${flight.DayOfWeek}${flight.CRSDepTime}${flight.Dest}`;
                    });

                flightsNewData.enter()
                    .append("line")
                    .attr("class", "flight")
                    .attr("x1", function(d) {
                        if (d.startingPoint) return d.startingPoint[0];
                    })
                    .attr("y1", function(d) {
                        if (d.startingPoint) return d.startingPoint[1];
                    })
                    .attr("x2", function(d) {
                        if (d.startingPoint) return d.destinationPoint[0];
                    })
                    .attr("y2", function(d) {
                        if (d.startingPoint) return d.destinationPoint[1];
                    })
                    .on("mouseover", flightHover)
                    .on("mouseout", flightBlur)
                    .style('stroke-opacity', 0)
                    .transition(trans)
                    .delay(flightsNewData.exit().size() ? 1500 : 500)
                    .attr('marker-end', 'url(#triangle)')
                    .style('stroke-opacity', 1);

                flightsNewData.exit()
                    .attr("class", "exit")
                    .transition(trans)
                    .delay(500)
                    .style('stroke-opacity', 0)
                    .remove();

                const airportsNewData = airports.selectAll("circle.airport")
                    .data(updatedAirports, airport => airport.airport);

                airportsNewData.enter()
                    .append("circle")
                    .on("mouseover", airportHover)
                    .on("mouseout", airportBlur)
                    .attr("class", "airport")
                    .attr('cx', function(d) {
                        var cxMove = projection([+d.long, +d.lat]);
                        if (cxMove) return cxMove[0];
                    })
                    .attr('cy', function(d) {
                        var cyMove = projection([+d.long, +d.lat]);
                        if (cyMove) return cyMove[1];
                    })
                    .transition(trans)
                    .delay(airportsNewData.exit().size() ? 1000 : 0)
                    .attr('r', 0)
                    .attr('r', 3);

                airportsNewData.exit()
                        .attr("class", "exit")
                    .transition(trans)
                        .attr('r', 0)
                        .remove();
            }

        });

    }

    chart.toggleFlights = function(show) {
        showFlights = show;
        updateData();
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    chart.stateFilter = function (value) {
        selectState  = value;
    };

    return chart;
}
