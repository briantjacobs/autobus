var bus = bus || {};

bus = {
	genColor: function() {
		var colors = d3.scale.category20().range();
		return function(d, i) { return d.color || colors[i % colors.length]; };
	},
	stopPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 500,
			xValue = function(d) { return d[0]; },
			yValue = function(d) { return d[1]; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear();

		function chart(selection) {
			selection.each(function(data) {
				// Convert data to standard representation greedily;
				// this is needed for nondeterministic accessors.
				data = data.map(function(d, i) {
					return [xValue.call(data, d, i), yValue.call(data, d, i)];
				});

				// Update the x-scale.
				xScale
					.domain(d3.extent(data, function(d) { return d[0]; }))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(data, function(d) { return d[1]; })])
					.range([height - margin.top - margin.bottom, 0]);

				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([data]);

				// Otherwise, create the skeletal chart.
				var gEnter = svg.enter().append("svg").append("g");

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var stops = g.selectAll(".stops").data(data).enter()
								.append("g").attr("class","stops");
						
						stops.append("circle")
								.attr("r", 3)
								.attr("cx", function(d){return X(d);})
								.attr("cy", 0);

						var stopTarget = stops.append("rect")
											.attr("r", 3)
											.attr("x", function(d){return X(d)-6;})
											.attr("y", 0)
											.attr("width", 12)
											.style("opacity", 0)
											.attr("height", height-margin.bottom);

						stopTarget.on("mouseover",function(d,i) {
							d3.selectAll(stopTarget[0]).style("opacity", 0)
							d3.select(stopTarget[0][i]).style("opacity", 0.5).transition().duration(250)
						});


				g.append("g").attr("class","line")
					.append("line")
						.style('stroke', "#000")
						.attr("x1",0)
						.attr("y1",0)
						.attr("x2",xScale.range()[1])
						.attr("y2",0);

			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ xValue.
		function X(d) {
			return xScale(d[0]);
		}

		// The x-accessor for the path generator; yScale âˆ˜ yValue.
		function Y(d) {
			return yScale(d[1]);
		}

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.x = function(_) {
			if (!arguments.length) return xValue;
			xValue = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return yValue;
			yValue = _;
			return chart;
		};

		return chart;
	},

barChart : function() {
	var margin = {top: 30, right: 10, bottom: 50, left: 100},
			width = 420,
			height = 420,
			yRoundBands = 0.2,
			yValue = function(d) { return d[0]; },
			xValue = function(d) { return d[1]; },
			yScale = d3.scale.ordinal(),
			xScale = d3.scale.linear(),
			yAxis = d3.svg.axis().scale(yScale).orient("left"),
			xAxis = d3.svg.axis().scale(xScale),
			color = bus.genColor();
			

	function chart(selection) {
		selection.each(function(data) {

			// Convert data to standard representation greedily;
			// this is needed for nondeterministic accessors.
			data = data.map(function(d, i) {
				return [yValue.call(data, d, i), xValue.call(data, d, i)];
			});
		
			// Update the y-scale.
			yScale
					.domain(data.map(function(d) { return d[0];} ))
					.rangeRoundBands([0, width - margin.left - margin.right], yRoundBands);
				 

			// Update the x-scale.
			xScale
					.domain([0,d3.max(data.map(function(d) { return d[1];} ))])
					.range([0,height - margin.top - margin.bottom])
					.nice();
					

			// Select the svg element, if it exists.
			var svg = d3.select(this).selectAll("svg").data([data]);

			// Otherwise, create the skeletal chart.
			var gEnter = svg.enter().append("svg").append("g");
			gEnter.append("g").attr("class", "bars");
			gEnter.append("g").attr("class", "y axis");
			gEnter.append("g").attr("class", "x axis");
			gEnter.append("g").attr("class", "x axis zero");

			// Update the outer dimensions.
			svg .attr("width", width)
					.attr("height", height);

			// Update the inner dimensions.
			var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		 // Update the bars.
			var bar = svg.select(".bars").selectAll(".bar").data(data);
				bar.enter().append("rect");
				bar.exit().remove();
				bar.transition().duration(500)
					.attr("class", function(d, i) { return d[1] < 0 ? "bar negative" : "bar positive"; })
					.attr("y", function(d) { return Y(d); })
					//.attr("x", function(d, i) { return d[1] < 0 ? X0() : X(d); })
					.attr("x", function(d, i) { return 0; })
					.attr("height", yScale.rangeBand())
					.style("fill", function(d,i) { return color(d,i); })
					.attr("width", function(d, i) { return Math.abs( X(d) - X0() ); });

		// y axis at the bottom of the chart
			g.select(".y.axis").transition().duration(500)
			 // .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")
				//.call(yAxis.orient("bottom"));
				.call(yAxis);
		
			// Update the x-axis.
			g.select(".x.axis").transition().duration(500)
				.call(xAxis.orient("top"));
					
		});
	}


// The y-accessor for the path generator; xScale ∘ xValue.
	function Y(d) {
		return yScale(d[0]);
	}

	function X0() {
		return xScale(0);
	}

	// The x-accessor for the path generator; yScale ∘ yValue.
	function X(d) {
		return xScale(d[1]);
	}

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin = _;
		return chart;
	};

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.x = function(_) {
		if (!arguments.length) return xValue;
		xValue = _;
		return chart;
	};

	chart.y = function(_) {
		if (!arguments.length) return yValue;
		yValue = _;
		return chart;
	};

	return chart;
},

	streamPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 500,
			xValue = function(d) { return d.x; },
			yValue = function(d) { return d.y; },
			getValues = function(d) { return d.values; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear(),
			area = d3.svg.area(),
			stack =  d3.layout.stack().offset("wiggle").order('inside-out'),
			color = bus.genColor();
		function chart(selection) {
			selection.each(function(data,i) {

				data = data.map(function(d) {
							d.values = d.values.map(function(j,i) {
								return { type:d.type, x: xValue.call(data, j, i), y: yValue.call(data, j, i)};
							});
							return d;
						});

				var mergedValues = d3.merge(data.map(function(d) {return d.values;}));
				//console.log(data, mergedValues)


				area
					.interpolate("cardinal")
					.x(function(d){return X(d);})
					.y0(function(d){return Y0(d);})
					.y1(function(d) { return Y1(d); });

				stack
					.x(xValue)
					.y(yValue)
					.values(getValues);

				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([stack(data)]);

				xScale
					.domain(d3.extent(mergedValues, function(d) { return d.x; }))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(mergedValues, function(d) {return d.y+d.y0;})])
					.range([height - margin.top - margin.bottom, 0]);




				// Otherwise, create the skeletal chart.
				var gEnter = svg.enter().append("svg").append("g");
				gEnter.append("g").attr("class", "x axis");

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				// Update the area path.
				//g.select(".area")
				//  .attr("d", function(d,i) { console.log(d); return area(d.values) });


				var areaPaths = g.selectAll(".area").data(data);
								areaPaths.enter().append("path");
								areaPaths.exit().remove();
								areaPaths.transition().duration(1000)
									.attr("class", "area")
									.style("fill", function(d,i) { return color(d,i); })
									.attr("d", function(d,i) {return area(d.values); });
											
								


				var timeLookup = d3.nest()
									.key(function(d) { return d.x; })
									.entries(mergedValues);


				svg.on("mousemove", function(d,i) {
						var e = d3.event;
						var timePosLeft = xScale.invert(e.offsetX-margin.left-10);
						var timePosRight = xScale.invert(e.offsetX-margin.left+10);

						timeLookup.forEach(function(h,i) {
							var stopTime = new Date(h.key);
							if (stopTime.getTime() > timePosLeft.getTime() && stopTime.getTime() < timePosRight.getTime()) {
								var barChart = bus.barChart()
									.x(function(d) { return d.y;  })
									.y(function(d) { return d.type; });
								d3.select("#bars")
									.datum(timeLookup[i].values)
									.call(barChart);
							}
						});

				/*var domainIndexScale = d3.time.scale()
										.domain(d3.extent(mergedValues, function(d) { return d.x; }))
										.range([0, data.length]);
				*/
									});

			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ xValue.
		function X(d) {
			return xScale(d.x);
		}

		// The x-accessor for the path generator; yScale âˆ˜ yValue.
		function Y1(d) {
			return yScale(d.y + d.y0);
		}

		function Y0(d) {
			return yScale(d.y0);
		}
	

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.x = function(_) {
			if (!arguments.length) return xValue;
			xValue = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return yValue;
			yValue = _;
			return chart;
		};

		return chart;
	}


};




$(function(){





d3.json("scripts/test_stream.json", function(data) {
	var formatDate = d3.time.format("%H:%M%p");

	var streamPlot = bus.streamPlot()
					.x(function(d) { 	
						if (typeof d.x == "string") {
							return formatDate.parse(d.x);
						} else {
							return d.x;
						}
					})
					.y(function(d) { return d.y; })


	d3.select("#stream")
		.datum(data)
		.call(streamPlot);

	d3.json("scripts/test_stream2b.json", function(data2) {

		$('.button').click(function(){
				d3.select("#stream")
					.datum(data2)
					.call(streamPlot);
		});
	});

	d3.json("scripts/23_stops.json", function(data) {
	//bus.data = data;
	var formatDate = d3.time.format("%H:%M%p");
	var stopPlot = bus.stopPlot()
			.x(function(d) { return formatDate.parse(d.arrival_time); })
			.y(function(d) { return +Math.random(10); });

		d3.select("#stream")
			.datum(data)
			.call(stopPlot);
	});


});

});