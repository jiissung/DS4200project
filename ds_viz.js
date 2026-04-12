const margin = {top: 40, right: 20, bottom: 80, left: 60},
      width = 700 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

const x = d3.scaleBand().padding(0.3).range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g")
  .attr("transform", `translate(0,${height})`);

const yAxis = svg.append("g");

d3.csv("StudentPerformanceFactors.csv").then(data => {

  data.forEach(d => {
    d.Exam_Score = +d.Exam_Score;
  });

  function update(groupVar) {

    const summary = d3.rollups(
      data,
      v => d3.mean(v, d => d.Exam_Score),
      d => d[groupVar]
    ).map(([key, value]) => ({
      category: key,
      avg: value
    }));

    x.domain(summary.map(d => d.category));
    y.domain([0, d3.max(summary, d => d.avg) + 5]);

    xAxis.transition().call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    yAxis.transition().call(d3.axisLeft(y));

    const bars = svg.selectAll("rect").data(summary, d => d.category);

    bars.enter()
      .append("rect")
      .attr("x", d => x(d.category))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#2ca02c")
      .on("mousemove", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<b>${d.category}</b><br>${d.avg.toFixed(2)}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseleave", () => tooltip.style("opacity", 0))
      .merge(bars)
      .transition()
      .attr("x", d => x(d.category))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.avg))
      .attr("height", d => height - y(d.avg));

    bars.exit().remove();
  }

  update("Motivation_Level");

  d3.select("#dropdown").on("change", function() {
    update(this.value);
  });

});