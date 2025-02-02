"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

type BarChartProps = {
  data: { label: string; value: number }[];
};

export default function BarChart({ data }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null); // Separate ref for the legend

  const colorMapping: { [key: string]: string } = {
    "Operational Costs": "#38761d", // Green
    "Damage Costs": "#cc0000", // Red
  };

  useEffect(() => {
    if (!svgRef.current || !legendRef.current) return;

    // Clear previous chart and legend to prevent duplication
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(legendRef.current).selectAll("*").remove();

    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("display", "block")
      .style("margin", "auto");

    const chart = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width - margin.left - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);

    chart.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "14px")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45) translate(-5, 5)");

    chart.append("g").call(d3.axisLeft(y));

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    chart.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.label)!)
      .attr("y", y(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) => colorMapping[d.label] || "#3B82F6")
      .on("mouseover", function (event, d) {
        const darkerColor = d3.color(colorMapping[d.label])?.darker(1)?.toString() || colorMapping[d.label];
        d3.select(this).transition().duration(200).attr("fill", darkerColor);

        tooltip
          .style("opacity", 1)
          .html(`${d.label}: $${d.value.toLocaleString()}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", colorMapping[d.label]);
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value));

    // Add Legend to a Separate Div
    const legend = d3.select(legendRef.current);

    legend
      .selectAll("div")
      .data(data)
      .enter()
      .append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "10px")
      .html(
        (d) =>
          `<div style="width: 20px; height: 20px; background-color: ${
            colorMapping[d.label]
          }; margin-right: 10px; border-radius: 4px;"></div>
           <span style="font-size: 16px;">${d.label}</span>`
      );
  }, [data]);

  return (
    <div className="flex flex-row items-start w-full max-w-5xl">
      {/* Left: Chart */}
      <div className="flex-1">
        <div className="flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Right: Legend */}
      <div ref={legendRef} className="flex flex-col justify-start items-start ml-6"></div>
    </div>
  );
}
