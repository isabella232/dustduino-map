/*global Air, Backbone*/

Air.Collections = Air.Collections || {};

(function () {
    'use strict';

    // collection for multiple sensors
    Air.Collections.Readings = Backbone.Collection.extend({
        model: Air.Models.Reading,
        url: 'http://brazil-sensor.herokuapp.com/api/v1/readings',

        initialize: function(options) {
            if (options.id) {
                this.url += ('/?sensor=' + options.id);
            }
        },
        parse: function(resp) {
            return resp.results;
        }
    });

})();
