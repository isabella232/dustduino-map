/*global Air, Backbone, JST*/

Air.Views = Air.Views || {};

(function () {
    'use strict';

    // detect when window has finished resizing
    $(window).resize(function() {
        if (this.resizeTo) clearTimeout(this.resizeTo);
        this.resizeTo = setTimeout(function() {
            $(this).trigger('resizeEnd');
        }, 300);
    });

    Air.Views.Chart = Backbone.View.extend({

        events: {},
        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
            var resize = $.proxy(this.resize, this),
                $el = this.$el;

            $(window).bind('resizeEnd', function() {
                $el.fadeOut(150, function() {
                    resize();
                    $el.fadeIn(250);
                });
            });
        },

        dragmove: function() {

            this.pos -= d3.event.dx;
            if (this.pos < this.limit || this.pos > 20) {
                this.pos = this.lastpos;
                return;
            }
            this.lastpos = this.pos;

            this.base.style('right', this.pos + 'px');
        },

        resize: function() {

            // if it's not showing, don't bother
            if (this.$el.is(':visible')) return;

            var days = this.collection.length / 24,
                width = this.$el.width() * days;

            this.x.range([0, width]);

            var x = this.x,
                dblWidth = x(2) - x(1),
                barWidth = dblWidth / 2 - 4;

            this.base//.transition()
                //.delay(100)
                .attr('width', width);

            this.bars[0]//.transition()
                //.duration(100)
                .attr('x', function(d, i) { return x(i) - barWidth })
                .attr('width', barWidth);

            this.bars[1]//.transition()
                //.duration(100)
                .attr('x', function (d, i) { return x(i) })
                .attr('width', barWidth);

            this.xAxis
                .attr('transform', function(d) {
                    return 'translate(' + x(d.index) + ',12)'
                })

            // calculate roughly where we were before
            this.pos = width * this.pos / this.width;
            this.base.style('right', this.pos + 'px');

            this.limit = -width / days * (days - 1) - 50;
            this.width = width;
        },

        render: function () {

            var hours = this.collection.length,
                days = hours / 24,
                margin = this.margin = [20, 15, 20, 15],
                width = this.width = this.$el.width() * days - margin[1] - margin[3],
                height = 140 - margin[0] - margin[2];



            //*********** drag **************

            this.pos = 0;
            this.nextpos = 0;
            this.limit = -width / days * (days - 1) - 50;
            var dragmove = $.proxy(this.dragmove, this),
                drag = d3.behavior.drag()
                    .on('drag', dragmove);


            //*********** init **************

            var base = this.base = d3.select('#' + this.id).append('svg:svg')
                .attr('width', width + margin[1] + margin[3])
                .attr('height', height + margin[0] + margin[2])
                .attr('class', 'slider drag')
                .call(drag);

            var svg = base.append('g')
                .attr('class', 'bar-chart')
                .attr('transform', 'translate(' + margin[3] + ',' + margin[0] + ')')

            var max = d3.max(this.collection.pluck('pm10').concat(
                this.collection.pluck('pm25')));

            var x = this.x = d3.scale.linear()
                .domain([0, hours])
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0, max]);

            var dblWidth = x(1) - x(0),
                barWidth = Math.floor(dblWidth) / 2 - 4;


            //*********** axis **************

            var ticks = [];
            _.each(this.collection.models, function(model, i) {
                if (model.attributes.hour % 6 === 0) {
                    ticks.push({hour: model.attributes.hour + ':00' , index: i});
                }
            });

            this.xAxis = base.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + margin[3] + ',' + (height + margin[0]) + ')')
                .selectAll('.tick')
                .data(ticks)
              .enter().append('text')
                .attr('class', 'tick')
                .attr('text-anchor', 'middle')
                .attr('transform', function(d) {
                    return 'translate(' + x(d.index) + ',12)'
                })
                .text(function(d) { return d.hour });

            $('#hourly-max').html(Math.ceil(max) + ' &ndash;');
            $('#hourly-mid').html(Math.ceil(max / 2) + ' &ndash;');
            $('#hourly-min').html('0 &ndash;');

            //*********** bars **************

            var pm25 = svg.selectAll('.pm25')
                .data(this.collection.models)
              .enter().append('rect')
                .attr('class', 'pm25')
                .attr('x', function(d, i) { return x(i) - barWidth })
                .attr('y', height)
                .attr('width', barWidth)
                .attr('height', 0);

            var pm10 = svg.selectAll('.pm10')
                .data(this.collection.models)
              .enter().append('rect')
                .attr('class', 'pm10')
                .attr('x', function(d, i) { return x(i) })
                .attr('y', height)
                .attr('width', barWidth)
                .attr('height', 0);

            pm25.transition()
                .duration(200)
                .delay(function(d, i) { return (hours - i) * 30 })
                .attr('y', function(d) { return y(d.attributes.pm25)})
                .attr('height', function(d) { return height - y(d.attributes.pm25)});

            pm10.transition()
                .duration(200)
                .delay(function(d, i) { return (hours - i) * 30 })
                .attr('y', function(d) { return y(d.attributes.pm10)})
                .attr('height', function(d) { return height - y(d.attributes.pm10)});

            this.bars = [pm25, pm10];
        }

    });

})();
