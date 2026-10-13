"use strict";
/// <reference types="d3" />
var _a;
// Sample data
const data = [4, 8, 15, 16, 23, 42];
// Set up the SVG element
const width = 400;
const height = 200;
const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
// Create a linear scale for the y - axis
const y = d3.scaleLinear()
    .domain([0, (_a = d3.max(data)) !== null && _a !== void 0 ? _a : 0])
    .range([height, 0]);
// Create a band scale for the x - axis
const x = d3.scaleBand()
    .domain(data.map((d, i) => i.toString()))
    .range([0, width])
    .padding(0.1);
// Create the bars
svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d, i) => { var _a; return (_a = x(i.toString())) !== null && _a !== void 0 ? _a : 0; })
    .attr('y', (d) => y(d))
    .attr('width', x.bandwidth())
    .attr('height', (d) => height - y(d))
    .attr('fill', 'steelblue');
