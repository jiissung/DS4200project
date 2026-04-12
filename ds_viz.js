const margin = {top: 40, right: 20, bottom: 80, left: 60},
      width = 700 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const controls = d3.select("#chart")
  .insert("div", ":first-child")
  .style("margin-bottom", "20px");

controls.append("label")
  .attr("for", "factorSelect")
  .style("margin-right", "10px")
  .style("font-weight", "bold")
  .text("Factor: ");

const factorOptions = [
  "Motivation_Level",
  "Family_Income",
  "Parental_Involvement",
  "Internet_Access",
  "Access_to_Resources"
];

const factorLabels = {
  Motivation_Level: "Motivation Level",
  Family_Income: "Family Income",
  Parental_Involvement: "Parental Involvement",
  Internet_Access: "Internet Access",
  Access_to_Resources: "Access to Resources"
};

const dropdown = controls.append("select")
  .attr("id", "factorSelect")
  .style("padding", "6px 10px")
  .style("margin-right", "15px");

dropdown.selectAll("option")
  .data(factorOptions)
  .enter()
  .append("option")
  .attr("value", d => d)
  .text(d => factorLabels[d]);

controls.append("button")
  .attr("id", "sortButton")
  .style("padding", "6px 10px")
  .text("Sort: Default");

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "6px")
  .style("padding", "8px 10px")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");

const x = d3.scaleBand().range([0, width]).padding(0.3);
const y = d3.scaleLinear().range([height, 0]);

const xAxisGroup = svg.append("g")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = svg.append("g");

const title = svg.append("text")
  .attr("x", width / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold");

svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 70)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("font-weight", "bold")
  .text("Category");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("font-weight", "bold")
  .text("Average Exam Score");

let sortDescending = false;
let fullData = [];

function categoryOrder(factor) {
  if (["Motivation_Level", "Family_Income", "Parental_Involvement", "Access_to_Resources"].includes(factor)) {
    return ["Low", "Medium", "High"];
  }
  if (factor === "Internet_Access") {
    return ["No", "Yes"];
  }
  return null;
}

function getColor(category) {
  const colorMap = {
    Low: "#d62728",
    Medium: "#ff7f0e",
    High: "#2ca02c",
    No: "#d62728",
    Yes: "#2ca02c"
  };
  return colorMap[category] || "#4e79a7";
}

function summarizeData(data, factor) {
  let summary = d3.rollups(
    data,
    v => d3.mean(v, d => d.Exam_Score),
    d => d[factor]
  )
    .map(([category, avgScore]) => ({
      category,
      avgScore
    }))
    .filter(d => d.category != null);

  const manualOrder = categoryOrder(factor);

  if (sortDescending) {
    summary.sort((a, b) => d3.descending(a.avgScore, b.avgScore));
  } else if (manualOrder) {
    summary.sort((a, b) => manualOrder.indexOf(a.category) - manualOrder.indexOf(b.category));
  } else {
    summary.sort((a, b) => d3.ascending(a.category, b.category));
  }

  return summary;
}

function updateChart(factor) {
  const summary = summarizeData(fullData, factor);

  x.domain(summary.map(d => d.category));
  y.domain([0, d3.max(summary, d => d.avgScore) + 5]);

  title.text(`Average Exam Score by ${factorLabels[factor]}`);

  xAxisGroup.transition()
    .duration(800)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  yAxisGroup.transition()
    .duration(800)
    .call(d3.axisLeft(y));

  const bars = svg.selectAll(".bar")
    .data(summary, d => d.category);

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", d => getColor(d.category))
    .on("mousemove", function(event, d) {
      d3.select(this).attr("opacity", 0.8);

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${factorLabels[factor]}:</strong> ${d.category}<br>
          <strong>Average Exam Score:</strong> ${d.avgScore.toFixed(2)}
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseleave", function() {
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    })
    .merge(bars)
    .transition()
    .duration(800)
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.avgScore))
    .attr("height", d => height - y(d.avgScore))
    .attr("fill", d => getColor(d.category));

  bars.exit()
    .transition()
    .duration(500)
    .attr("y", height)
    .attr("height", 0)
    .remove();

  const labels = svg.selectAll(".bar-label")
    .data(summary, d => d.category);

  labels.enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .merge(labels)
    .transition()
    .duration(800)
    .attr("x", d => x(d.category) + x.bandwidth() / 2)
    .attr("y", d => y(d.avgScore) - 8)
    .text(d => d.avgScore.toFixed(1));

  labels.exit().remove();
}

d3.csv("data/StudentPerformanceFactors.csv").then(data => {
  data.forEach(d => {
    d.Exam_Score = +d.Exam_Score;
  });

  fullData = data;
  updateChart("Motivation_Level");

  dropdown.on("change", function() {
    updateChart(this.value);
  });

  d3.select("#sortButton").on("click", function() {
    sortDescending = !sortDescending;
    d3.select(this).text(sortDescending ? "Sort: High to Low" : "Sort: Default");
    updateChart(dropdown.property("value"));
  });
});