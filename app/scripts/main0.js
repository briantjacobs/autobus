var bus = bus || {};

bus = {
	width: 500,
	height: 500,
	margin: {top:10, right: 10, bottom: 10, left: 10},
	drawStream: function(options) {

		this.options = {
			data: '',
			viz: '',
			type: '',
			yLabel: ''
		};
		var opt = $.extend({}, this.options, options);

		var color = d3.interpolateRgb("#aad", "#556");

		var xScale = d3.time.scale()
						.domain(d3.extent(opt.data, function(d) { return d.arrival_time; }))
						.range([0, bus.width - bus.margin.left - bus.margin.right]);
		var yScale = d3.scale.linear()
						.domain([0, d3.max(opt.data, function(d) { return d[1]; })])
						.range([bus.height - bus.margin.top - bus.margin.bottom, 0]);

						console.log(opt.data[0].arrival_time)
		//console.log(d3.map(opt.data).forEach(function(d){return this}),d3.map(opt.data) )
						//.key(})
						//.key(function(d){return d.stats[opt.type];})
						//.entries(opt.data)
		
		//var stats = opt.data[opt.type];		
		//console.log(d3.values(opt.data))		

			/*opt.data.forEach(function(stop) {
				//console.log(stop.stats[opt.type], opt.type)
				stop.stats[opt.type].forEach(function(d) {
					return {
						x: stop.arrival_time,
						y: d.value
					};
				});
			});*/
		

		var layers = [
		{
			"name": "apples",
			"values": [
			{ "x": 0, "y":  91},
			{ "x": 1, "y": 290}
			]
		},
		{
			"name": "oranges",
			"values": [
			{ "x": 0, "y":  9},
			{ "x": 1, "y": 49}
			]
		}
		];

		var m = 2; // number of samples per layer
		var width = 960,
			height = 500,
			mx = m - 1,
			my = 350;

		var stack = d3.layout.stack()
			.offset("wiggle")
			.values(function(d) {
				var thing = [];
				d.stats[opt.type].forEach(function(item) {
					thing.push({
						x: xScale(d.arrival_time),
						y: parseInt(item.value,10)
					});
				});
				console.log(thing)
				return thing;
				 });

		var area = d3.svg.area()
			.x(function(d) {
				return d.x * width / mx;
			})
			.y0(function(d) {
				return height - d.y0 * height / my;
			})
			.y1(function(d) {
				return height - (d.y + d.y0) * height / my;
			});

		opt.viz.selectAll("path")
			.data(stack(opt.data))
			.enter().append("path")
			.attr("d", function(d) { return area(d.values); })
			.append("title")
			.text(function(d) { return d.name; });

	}
};




$(function(){
	var viz = d3.select('.stream').append("svg:svg")
		.attr("width", bus.width)
		.attr("height", bus.height);

	d3.json('scripts/23.json', function(data) {

		//preprocess dates
		var format = d3.time.format("%H:%M%p");
		data.forEach(function(d) {
			d.arrival_time = format.parse(d.arrival_time);
		});

		bus.drawStream({
			data: data,
			viz: viz,
			type: "demographics"
		});
	});
});