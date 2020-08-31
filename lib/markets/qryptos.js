var request = require('request');
 
var base_url = 'https://api.qryptos.com';
function get_summary(coin, exchange, cb) {
    var summary = {};
    request({ uri: base_url + '/products/' + exchange, json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else if (body) {
            summary['bid'] = body['market_bid'].toFixed(8);
            summary['ask'] = body['market_ask'].toFixed(8);
            summary['volume'] = body['volume_24h'];
            summary['high'] = body['high_market_ask'].toFixed(8);
            summary['low'] = body['low_market_bid'].toFixed(8);
            summary['last'] = body['last_traded_price'].toFixed(8);
            summary['previous_day'] = body['last_price_24h'].toFixed(8);
            summary['currency'] = body['currency'];
            console.log(summary);
            return cb(null, summary);
        } else {
            return cb(error, null);
        }
    });
        
}
function get_trades(coin, exchange, cb) {
    var req_url = base_url + '/executions?limit=20&page=1&product_id=' + exchange;
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body) {
            var tTrades = body["models"];
            var trades = [];
            for (var i = 0; i < tTrades.length; i++) {
                var Trade = {
                    ordertype: tTrades[i]["taker_side"],
                    amount: parseFloat(tTrades[i]["quantity"]).toFixed(8),
                    price: parseFloat(tTrades[i]["price"]).toFixed(8),
                    //  total: parseFloat(tTrades[i].Total).toFixed(8)
                    // Necessary because API will return 0.00 for small volume transactions
                    total: (parseFloat(tTrades[i]["quantity"]).toFixed(8) * parseFloat(tTrades[i]["price"])).toFixed(8),
                    timestamp: tTrades[i]["created_at"]
                }
                trades.push(Trade);
            }
            return cb(null, trades);
        } else {
            return cb(body.Message, null);
        }
    });
}

function get_orders(coin, exchange, cb) {
    var req_url = base_url + '/products/' + exchange + '/price_levels';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body) {
            var orders = body;
            var buys = [];
            var sells = [];
            if (orders['buy_price_levels'].length > 0){
                for (var i = 0; i < orders['buy_price_levels'].length; i++) {
                    var order = {
                        amount: parseFloat(orders["buy_price_levels"][i][1]).toFixed(8),
                        price: parseFloat(orders["buy_price_levels"][i][0]).toFixed(8),
                        //  total: parseFloat(orders.Buy[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders["buy_price_levels"][i][1]).toFixed(8) * parseFloat(orders["buy_price_levels"][i][0])).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
                if (orders['sell_price_levels'].length > 0) {
                for (var x = 0; x < orders['sell_price_levels'].length; x++) {
                    var order = {
                        amount: parseFloat(orders["sell_price_levels"][x][1]).toFixed(8),
                        price: parseFloat(orders["sell_price_levels"][x][0]).toFixed(8),
                        //    total: parseFloat(orders.Sell[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders["sell_price_levels"][x][1]).toFixed(8) * parseFloat(orders["sell_price_levels"][x][0])).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.Message, [], [])
        }
    });
}


module.exports = {
    get_data: function (coin, exchange, cb) {
        var error = null;
        get_orders(coin, exchange, function (err, buys, sells) {
            if (err) { error = err; }
            get_trades(coin, exchange, function (err, trades) {
                if (err) { error = err; }
                get_summary(coin, exchange, function (err, stats) {
                    if (err) { error = err; }
                    return cb(error, { buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats });
                });
            });
        });
    }
};

