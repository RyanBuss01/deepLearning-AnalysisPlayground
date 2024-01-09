const prompt = require('prompt-sync')();
const ta = require("../../methods/ta")
const tools = require("../../methods/tools/tools")

var ls = {
    singleBackTest: function (tickerList, selector) {
        let sym = prompt("Select Ticker (SPY): ")
        if(sym=='') sym = 'SPY'
        console.clear()
        let fullbars=tickerList.filter(t=>t.ticker==sym.toUpperCase())[0].bars, changes=[]
        for(let i=100; i<fullbars.length; i++) {
            let bars = fullbars.slice(0, i)
            let filter = this.buyFilter(bars, selector)
            if(filter.bool) {
                let run=true, j=i+1
                while(run && j<fullbars.length) {
                    let nextBars = fullbars.slice(0, j)
                    if(this.sellFilter(nextBars, filter.trend, selector)) {
                        let change = tools.pDiff(bars[bars.length-1].ClosePrice, nextBars[nextBars.length-1].ClosePrice)
                        if(filter.trend=="Bullish" && change>0) changes.push(change)
                        if(filter.trend=="Bullish" && change<0) changes.push(change*-1)
                        if(filter.trend=="Bearish" && change>0) changes.push(change)
                        if(filter.trend=="Bearish" && change>0) changes.push(Math.abs(change))
                        i=j
                        run=false
                    } else j++
                }
            }

            process.stdout.write("\r\x1b[K")
            process.stdout.write(`iteration : ${i} / ${fullbars.length}`)
        }
        process.stdout.write("\r\x1b[K")

        let sum =tools.sum(changes)

        console.log(`total earnings: ${sum}`)
    },

    buyFilter: function (bars, selector) {
        switch(selector) {
            case 1: return this.buyFilter1(bars)
        }
    },

    sellFilter: function(bars, trend, selector) {
        switch(selector) {
            case 1: return this.sellFilter1(bars, trend)
        }
    },

    buyFilter1: function (bars) {
        let bool = false
        let candles = ta.getHeikinAshi(bars)
        let macd = ta.getMacd(tools.haToBarTranslator(candles))
        let last = candles[candles.length-1], last2 = candles[candles.length-2]

        //determine trend
        let bullish = (last.open==last.low && last2.open==last2.low)
        let bearish = (last.open==last.high && last2.open==last2.high)
        bool = (bullish && macd.macd>macd.signalLine) || (bearish && macd.macd<macd.signalLine) 

        // ensure first of trend
        if(bool) for(let i=3; i<candles.length-26; i++) {
            let lastbars = candles.slice(0, -i)
            let finalBar = lastbars[lastbars.length-1]
            let mac = ta.getMacd(lastbars)

            if((bullish && mac.signalLine>mac.macd) || (bearish && mac.signalLine<mac.macd)) {bool=true; break;}
            if((bullish && finalBar.close<finalBar.open) || (bearish && finalBar.close>finalBar.open)) {bool=true; break;}
            if((bullish && finalBar.low==finalBar.open) || (bearish && finalBar.high==finalBar.open))  {bool=false; break;}
        }

        let trend = bullish ? "Bullish" : bearish ? "Bearish" : "None"
        return {bool, trend}
    },

    sellFilter1: function (bars, trend) {
        let candles = ta.getHeikinAshi(bars)
        // let macd = ta.getMacd(tools.haToBarTranslator(candles))
        let last = candles[candles.length-1]
        if(trend=="Bullish") {
            if(last.close<last.open) return true
        }
        if(trend=="Bearish") {
            if(last.close>last.open) return true
        }
        return false
    }
}

module.exports=ls