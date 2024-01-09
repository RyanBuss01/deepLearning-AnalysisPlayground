const trend = require("./trend");
const haTrend = require("./HaTrend");
const ta = require("../../methods/ta");
const knn = require("../../methods/algos/knn");

funcHandler = {
    runner : function(tickerList, selector) {
        let resList = [], printList=[]
        for (let i=0; i<tickerList.length; i++) {
            process.stdout.write("\r\x1b[K")
            process.stdout.write(`iteration : ${i} / ${tickerList.length}`)
            let t = tickerList[i]
            let bars = t.bars, sym = t.ticker;
            if(bars.length <= 253) continue;
            let f = this.filterSelector(bars, selector.num, selector.type)
            if(f.filter) {
                resList.push(sym)
            }
        }
        process.stdout.write("\r\x1b[K")
        for(r of resList) printList.push(this.printer(tickerList.filter(t => t.ticker==r)[0], selector.num, selector.type))
        if(selector.num==4 && selector.type=='trend') printList.sort((a,b) => b.year-a.year)
        else if(selector.num==5 && selector.type=='trend') printList.sort((a,b) => b.diff-a.diff)
        else  printList.sort((a,b) => b.trend == "Bullish" ? 1 : -1)
        for(e of printList) console.log(e)
    },

    backTestRunner : function(tickerList, selector, type, i, {period=5}) {
        let resList = [], printList=[]
        for (let t of tickerList) {
            let bars = t.bars.slice(0, -i), sym = t.ticker;
            if(bars.length <= 253) continue;
            if(this.filterSelector(bars, selector, type).filter) {
                resList.push(sym)
            }
        }
        for(let j=0; j<resList.length; j++) printList.push(this.printer(tickerList.filter(t => t.ticker==resList[j])[0], selector, type, i))

        let total=0, succ=0
        for(p of printList) {
            let trend = p.trend, close = p.close, isSucc=false
            total++;
            let nextbars  = tickerList.filter(t=>t.ticker==p.sym)[0].bars.slice(-i)
            for (let i=0; i<period; i++) {
                if(isSucc) continue;
                if((trend=="Bullish" ? nextbars[i].ClosePrice > close : trend=="Bearish" ? nextbars[i].ClosePrice < close : false))  {
                    succ++; isSucc=true;
                }
            }
        }
        return(total ? Number((succ/total)*100) : null)
        
    },

    singleBackTestRunner : function(fullbars, selector, type, i, {period=5}) {
            let bars = fullbars.slice(0, i)
            let f = this.filterSelector(bars, selector, type)
            if(f.filter) {
                let close = bars[bars.length-1].ClosePrice
                for (let j=0; j<period; j++) {
                    if((f.trend=="Bullish" ? fullbars[i+j].ClosePrice > close : f.trend=="Bearish" ? fullbars[i+j].ClosePrice < close : false))  {
                        return {filter: true, succ: true}
                    }
                }
                return {filter: true, succ: false}
            }
        return  {filter: false, succ: false}
        
    },

    filterSelector: function (bars, selector, type) {
        if (type=='trend') return this.trendSelector(bars, selector)
        else if(type=='ha') return this.haSelector(bars, selector)
        else if(type=='algo')return this.algoSelector(bars, selector)
    },

    trendSelector: function (bars, selector) {
        switch (selector) {
            case 1 : return trend.preSet1Filter(bars); break;
            // case 2 : return trend.preSet2Filter(bars); break;
            case 3 : return trend.preSet3Filter(bars); break;
            case 4 : return trend.preSet4Filter(bars); break;
            case 5 : return trend.preSet5Filter(bars); break;
            case 6 : return trend.preSet6Filter(bars); break;
            case 7 : return trend.preSet7Filter(bars); break; // superTrend and DEMA
            case 8 : return trend.preSet8Filter(bars); break; // HA candles
        }
    },

    haSelector: function (bars, selector) {
        switch (selector) {
            case 1 : return haTrend._1(bars); break;
            case 2 : return haTrend._2(bars); break;
            case 3 : return haTrend._3(bars); break;
            case 4 : return haTrend._4(bars); break;
            case 5 : return haTrend._5(bars); break;
            case 6 : return haTrend._6(bars); break;
            case 7 : return haTrend._7(bars); break;
            case 8 : return haTrend._8(bars); break;
        }
    },

    algoSelector: function (bars, selector) {
        switch (selector) {
            case 1 : return knn.runner(bars); break;
        }
    },

    printer : function (tick, selector, type, i) {
        // Must return close and trend - for backtesting
        let sym = tick.ticker, bars = tick.bars
        if(i) bars = bars.slice(0, -i)
        let close = bars[bars.length-1].ClosePrice

        if(type=='algo') {
            let candles = ta.getHeikinAshi(bars)
            let trend = candles[candles.length-1].open<candles[candles.length-1].close ? "Bullish" : "Bearish"
            return {sym, trend, close}
        }

        if(type=='ha') {
            let candles = ta.getHeikinAshi(bars)
            let trend = candles[candles.length-1].open<candles[candles.length-1].close ? "Bullish" : "Bearish"
            return {sym, trend, close}
        }

        if(selector==1) {
            let trend = close>ta.getEMA(bars.map(b=>b.ClosePrice), 200)? "Bullish" : "Bearish"
            return {sym, trend, close}
        }
        else if(selector==2) {}
        else if (selector==3) {
            let smma = ta.getSMMA(bars.map(b=>b.ClosePrice), 200);
            let trend = close>smma[smma.length-1]? "Bullish" : "Bearish"
            return {sym, trend, close}
        }
        else if(selector==4) {
            let change = {
                day : tools.pDiff( bars[bars.length-2].ClosePrice, close),
                week : tools.pDiff( bars[bars.length-6].ClosePrice, close),
                month: tools.pDiff( bars[bars.length-21].ClosePrice, close),
                year: tools.pDiff( bars[bars.length-251].ClosePrice, close)
            }
            change.day = Number(change.day.toFixed(2))
            change.week = Number(change.week.toFixed(2))
            change.month = Number(change.month.toFixed(2))
            change.year = Number(change.year.toFixed(2))

            return{sym, day: change.day, month: change.month, year: change.year, close}
        }
        else if(selector==5) {
            let sigMA = ta.getSignalMovingAverage(bars)
            return {sym, diff: tools.pDiff(sigMA[sigMA.length-1], close), close}
        }
        else if(selector==6 || selector==7) {
            let superTrendList = ta.getSuperTrend(bars, {}).superTrend
            let superTrend = superTrendList[superTrendList.length-1]
            let trend = superTrend<close ? "Bullish" : "Bearish"
            return {sym, trend, close}
        }

        else if (selector==8) {
            let candles = ta.getHeikinAshi(bars)
            let trend = candles[candles.length-1].open<candles[candles.length-1].close ? "Bullish" : "Bearish"
            return {sym, trend, close}
        }
    },
}

module.exports = funcHandler