const prompt = require('prompt-sync')();
const l = require('./loop')
const trend = require('../methods/trend');
const selector = require('./selector');
const technicals = require('../methods/technicals');
const lstm = require('../../methods/algos/lstm');


menu = {
    trends: function(tickerList) {
        console.log("Select Alert... \n\n1. preSet 1  \n2. preSet2 - 52 week high/low \n3. preset 3 - MFI, engulfing \n4. strong trends \n5. RSI crossover \n6. supertrend \n7. supertrend + macd \n8. HA candles\n") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()

        try {
            selector.selector(tickerList, Number(act), 'trend');
        }
        catch {
            console.log("Not a valid action"); l.loop()
        }

    },

    ha: function(tickerList) {
        console.log("Select Alert... \n\n1. trending candle \n2. new trend candle \n3. ema + stoch trend \n4. macd \n5. double supertrend \n6. xTrends \n7. Stochastic RSI + EMA \n8. Stochastic RSI\n") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()

            selector.selector(tickerList, Number(act), 'ha');

    },

    algo: function(tickerList) {
        console.log("Select Alert... \n\n1. knn\n2. LSTM \n") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()

        if(Number(act) == 2) lstm.run(tickerList.filter(t=>t.ticker=="SPY")[0].bars, tickerList, {})

        else selector.selector(tickerList, Number(act), 'algo');

    },

    technicals :function(tickerList) {
        console.log("Select Alert... \n\n1. doji candle") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()


        switch (act) {
            case "1" : technicals.findDojis(tickerList); break;
            default: {console.log("Not a valid action"); l.loop()}
        }
    },


    lsAlgos: function(tickerList) {
        console.log("Select Alert... \n\n1. heikin ashi + macd") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()

        selector.ls(tickerList, Number(act));
    },

        


   
}

module.exports=menu