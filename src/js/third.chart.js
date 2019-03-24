//= third_party/d3.min.js

// function thirdChartDataartTask() {
//
//     let data = [{name: 10}, {name: 2}];
//
//     let updateData;
//
//     function chart(selection) {
//
//         selection.each(function() {
//
//             const svg = d3.select(this)
//                 .append('svg')
//                 .append('g');
//
//             const barDiagram = svg.append('g')
//                 .attr('class', 'bar-diagram');
//
//             const bars = barDiagram
//                 .selectAll('.bar')
//                 .data(data)
//                     .enter()
//                     .append('rect')
//                     .attr('class', 'bar');
//
//             updateData = function() {
//                 // use D3 update pattern with data
//             };
//         });
//     }
//
//     chart.data = function(value) {
//         if (!arguments.length) return data;
//         data = value;
//         if (typeof updateData === 'function') updateData();
//         return chart;
//     };
//
//     return chart;
//
// };

barChart = (function() {

    let data = [];
    let updateData;

    let margin = { top: 10, right: 10, bottom: 30, left: 30 };
    let width = 800 - margin.left - margin.right;
    let height = 535 - margin.top - margin.bottom;

    function chart(selection){
        selection.each(function () {

            const svg = d3.select(this)
                .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                .append('g')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`);

            const barDiagram = svg.append('g')
                .attr('class', 'bar-diagram');

            // const bars = barDiagram
            //     .selectAll('rect.bar')
            //     .data(data, function(d) { return d.date; });
            //
            // bars.enter()
            //     .append('rect')
            //     .attr('class', 'bar');


            updateData = function() {

                var xScale = d3.scaleBand()
                    .domain(data.map(d => d.date))
                    .range([0, width])
                    .padding(0.2);

                var yScale = d3.scaleLinear()
                    .domain([0, 20])
                    .range([height, 0]);

                const bars = barDiagram
                    .selectAll('rect.bar')
                    .data(data, function(d) { return d.date; })



                bars.enter()
                    .append('rect')
                    .attr('class', 'bar')
                    .attr('x', d => xScale(d.date))
                    .attr('y', d => yScale(d.averageFlightDelay))
                    .attr('width', d => xScale.bandwidth())
                    .attr('height', d => height - yScale(d.averageFlightDelay));

                bars.exit()
                    .remove();



                // svg
                //     .append('g')
                //     .attr('transform', `translate(0, ${height})`)
                //     .call(d3.axisBottom(xScale));
                //
                // svg
                //     .append('g')
                //     .call(d3.axisLeft(yScale));
            }

        });
    }

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    return chart;
}) ();
