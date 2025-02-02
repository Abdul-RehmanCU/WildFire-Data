"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type PieChartProps = {
  data: { label: string; value: number }[];
};

export default function PieChart({ data }: PieChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !legendRef.current) return;

    // Clear previous chart and legend to prevent duplication
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(legendRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const colorMapping: { [key: string]: string } = {
      Addressed: "#38761d", // Green
      Missed: "#cc0000", // Red
    };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("display", "block")
      .style("margin", "auto")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<{ label: string; value: number }>().value((d) => d.value);
    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const arcs = svg
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorMapping[d.data.label] ?? "#ccc")
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          d
        );
        return function (t) {
          return arc(interpolate(t))!;
        };
      })
      .on("end", function (_, d) {
        d3.select(this)
          .on("mouseover", function (event, d: unknown) {
            const arcData = d as d3.PieArcDatum<{ label: string; value: number }>; // Explicit type casting

            const darkerColor = d3.color(colorMapping[arcData.data.label])?.darker(1)?.toString() || colorMapping[arcData.data.label];

            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", darkerColor);

            tooltip
              .style("opacity", 1)
              .html(`${arcData.data.label}: ${arcData.data.value}`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY}px`);
          })
          .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY}px`);
          })
          .on("mouseout", function (event, d: unknown) {
            const arcData = d as d3.PieArcDatum<{ label: string; value: number }>;

            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", colorMapping[arcData.data.label]);

            tooltip.style("opacity", 0);
          });
      });

    // Add number labels inside the pie slices
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "14px")
      .style("fill", "white")
      .text((d) => d.data.value === 0 ? "" : d.data.value);

    // Add Legend
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
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-start"
    >
      {/* Left: Pie Chart */}
      <div className="flex-1 flex justify-center">
        <svg ref={svgRef}></svg>
      </div>

      {/* Right: Legend */}
      <div ref={legendRef} className="ml-6"></div>
    </motion.div>
  );
}
