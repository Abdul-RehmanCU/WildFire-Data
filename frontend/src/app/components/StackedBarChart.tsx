"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type SeverityData = {
  category: string;
  low: number;
  medium: number;
  high: number;
};

type GroupedBarChartProps = {
  data: SeverityData[];
};

export default function GroupedBarChart({ data }: GroupedBarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !legendRef.current) return;

    // Clear previous chart and legend
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(legendRef.current).selectAll("*").remove();

    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    let isAnimationRunning = true; // Track whether animation is running

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("display", "block")
      .style("margin", "auto");

    const chart = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const subgroups = ["low", "medium", "high"] as const;
    const color = d3.scaleOrdinal<string>().domain(subgroups).range(["#f1d405", "#f78a08", "#cc0000"]);

    const x0 = d3.scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, width - margin.left - margin.right])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(subgroups)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => Math.max(d.low, d.medium, d.high)) ?? 0])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);

    chart.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("font-size", "14px")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    chart.append("g").call(d3.axisLeft(y));

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    chart.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x0(d.category) as number}, 0)`)
      .selectAll("rect")
      .data((d: SeverityData) => subgroups.map((key) => ({ key, value: d[key] })))
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.key)!)
      .attr("y", y(0))
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) => color(d.key))
      .on("mouseover", function (event, d) {
        const dataPoint = d as { key: string; value: number }; // Explicitly cast type
        if (isAnimationRunning) return;

        const darkerColor = d3.color(color(dataPoint.key))?.darker(1)?.toString() || color(dataPoint.key);
        d3.select(this).transition().duration(200).attr("fill", darkerColor);

        tooltip
          .style("opacity", 1)
          .html(`${dataPoint.key}: ${dataPoint.value}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mousemove", (event) => {
        if (isAnimationRunning) return;
        tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY}px`);
      })
      .on("mouseout", function (event, d) {
        const dataPoint = d as { key: string; value: number }; // Explicitly cast type
        if (isAnimationRunning) return;

        d3.select(this).transition().duration(200).attr("fill", color(dataPoint.key));
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value))
      .on("end", () => {
        isAnimationRunning = false; // Mark animation as completed
      });

    // Add Legend
    const legend = d3.select(legendRef.current);

    legend.selectAll("div")
      .data(subgroups)
      .enter()
      .append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "10px")
      .html(
        (d) =>
          `<div style="width: 20px; height: 20px; background-color: ${color(d)}; margin-right: 10px; border-radius: 4px;"></div>
           <span style="font-size: 16px;">${d.charAt(0).toUpperCase() + d.slice(1)}</span>`
      );
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-start"
    >
      {/* Left: Chart */}
      <div className="flex-1">
        <div className="flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Right: Legend */}
      <div ref={legendRef} className="ml-6"></div>
    </motion.div>
  );
}
