// Set dimensions and margins for the heat map
const margin = {top: 60, right: 20, bottom: 80, left: 90},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Append the SVG object to the body of the page
const svg = d3.select("#heatmap")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data
const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

d3.json(url).then(data => {
    const baseTemp = data.baseTemperature;
    const dataset = data.monthlyVariance;

    dataset.forEach(d => {
        d.month -= 1;  // Convert month to 0-based index
    });

    // Create scales
    const x = d3.scaleBand()
        .domain(dataset.map(d => d.year))
        .range([0, width])
        .padding(0.01);

    const y = d3.scaleBand()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .range([0, height])
        .padding(0.01);

    const colorScale = d3.scaleQuantize()
        .domain([d3.min(dataset, d => baseTemp + d.variance), d3.max(dataset, d => baseTemp + d.variance)])
        .range(["#4575b4", "#74add1", "#fdae61", "#d73027"]);

    // Append x-axis
    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter(year => year % 10 === 0)));

    // Append y-axis
    svg.append("g")
        .attr("id", "y-axis")
        .call(d3.axisLeft(y).tickFormat(month => d3.timeFormat("%B")(new Date(0, month))));

    // Append rectangles
    svg.selectAll(".cell")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("data-month", d => d.month)
        .attr("data-year", d => d.year)
        .attr("data-temp", d => baseTemp + d.variance)
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.month))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(baseTemp + d.variance))
        .on("mouseover", (event, d) => {
            const [xPos, yPos] = [event.pageX, event.pageY];
            d3.select("#tooltip")
                .style("left", `${xPos + 5}px`)
                .style("top", `${yPos - 28}px`)
                .style("visibility", "visible")
                .html(`Year: ${d.year}<br>Month: ${d3.timeFormat("%B")(new Date(0, d.month))}<br>Temp: ${(baseTemp + d.variance).toFixed(2)}℃`)
                .attr("data-year", d.year);
        })
        .on("mouseout", () => {
            d3.select("#tooltip")
                .style("visibility", "hidden");
        });

    // Append legend
    const legendWidth = 300;
    const legendHeight = 20;

    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${(width - legendWidth) / 2},${height + margin.bottom / 2})`);

    const legendScale = d3.scaleLinear()
        .domain([d3.min(dataset, d => baseTemp + d.variance), d3.max(dataset, d => baseTemp + d.variance)])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    legend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);

    const legendRect = legend.selectAll("rect")
        .data(colorScale.range().map(d => {
            const inv = colorScale.invertExtent(d);
            return [inv[0], inv[1]];
        }))
        .enter()
        .append("rect")
        .attr("x", d => legendScale(d[0]))
        .attr("y", 0)
        .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
        .attr("height", legendHeight)
        .attr("fill", d => colorScale(d[0]));
});
