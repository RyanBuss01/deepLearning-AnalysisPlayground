const tools = require('../../methods/tools/tools');
const toolsKNN = require('../../methods/tools/toolsKNN');
const ta = require('../../methods/ta.js')


var trend = {
    
    preSet1: function (tickerList) {
        let resList = []
        for (let t of tickerList) {
            let bars = t.bars, sym = t.ticker;
            if(bars.length <= 200) continue;
            let closes = bars.map(b=>b.ClosePrice)
            let ema = {
                _20: ta.getEMA(closes, 20),
                _50: ta.getEMA(closes, 50),
                _100: ta.getEMA(closes, 100),
                _200: ta.getEMA(closes, 200)
            }

            if(this.preSet1Filter(bars, ema)) {
                let trend = bars[bars.length-1]>ema._200? "Bullish" : "Bearish"
                resList.push({sym, trend})
            }
        }
        for(r of resList) console.log(r)
    },

    preSet1Filter: (bars) => {
        let ema = {
            _20: ta.getEMA(closes, 20),
            _50: ta.getEMA(closes, 50),
            _100: ta.getEMA(closes, 100),
            _200: ta.getEMA(closes, 200)
        }
        let close = bars[bars.length-1].ClosePrice
        let closes = bars.map(b=>b.ClosePrice)
        let isBuySignal = (close>ema._200)

        let bullish = (close>ema._20 && close>ema._50 && close>ema._100 && close>ema._200) 
        let bearish = (close<ema._20 && close<ema._50 && close<ema._100 && close<ema._200)
        if(!bullish && !bearish) return false;

        const filterVolatility = ta.volatilityBreak(bars.map(b=>b.HighPrice), bars.map(b=>b.LowPrice), bars.map(b=>b.ClosePrice), 1, 10);
        if(!filterVolatility) return false;

        const filterVolume = ta.volumeBreak(bars.map(b=>b.Volume), 49);
        if(!filterVolume) return false;

        let emaFilter = toolsKNN.emaFilter(bars, isBuySignal ? "Bullish" : "Bearish")
        if(!emaFilter) return false;

        let sidewaysFilter = toolsKNN.filter(bars)
        if(sidewaysFilter) return false;

        let monthChange = tools.pDiff(bars[bars.length-22].ClosePrice, close)
        let weekChange = tools.pDiff(bars[bars.length-6].ClosePrice, close)

        let movement = (bullish && monthChange > 20 &&weekChange>5) ||
        (bearish && monthChange < -20 &&weekChange <-5)
        if(!movement) return false;



        let steps=0
        for(let i=1; i<40; i++) {
            if(bullish && closes[closes.length-i]> closes[closes.length-(i+1)]) steps++
            if(bearish && closes[closes.length-i]< closes[closes.length-(i+1)]) steps++
        }

        if(steps<24) return false;


        return {filter: true, trend: bullish? "Bullish" : bearish? "Bearish": null}
    },


    preSet2: function (tickerList, back=false) {
        let dayList=[], weekList=[], resList=[];
        for(let i=0; i<tickerList.length; i++) {
            let bars = tickerList[i].bars, ticker = tickerList[i].ticker;
            if (bars.length < 252) continue;
            let json = trend.is52Week(bars)

            if(json.day=="high") dayList.push({ticker, trend: "Bullish"})
            else if(json.day=="low") dayList.push({ticker, trend: "Bearish"})
            else if(json.week=="high") weekList.push({ticker, trend: "Bullish"})
            else if(json.week=="low") weekList.push({ticker, trend: "Bearish"})
        }

        console.log("Day: \n")
        if(!back) for(let l of dayList) console.log(l)
        else {
            let dayRes = backTestResults(tickerList, dayList)
            let weekRes = backTestResults(tickerList, weekList)
        }
    },

    is52Week: function (bars) {


        if (bars.length < 252) {
            throw new Error("Insufficient data for a 52-week analysis.");
        }

        // Extract the last 252 bars
        const last52Weeks = bars.slice(-252);

        // Find highest and lowest closing prices in the last 52 weeks
        let highestClose = Number.NEGATIVE_INFINITY;
        let lowestClose = Number.POSITIVE_INFINITY;

        for (const bar of last52Weeks) {
            if (bar.ClosePrice > highestClose) {
                highestClose = bar.ClosePrice;
            }
            if (bar.close < lowestClose) {
                lowestClose = bar.ClosePrice;
            }
        }

        const latestClose = bars[bars.length - 1].ClosePrice;

        let day, week;

        if (latestClose === highestClose) {
            day = "high"
        } else if (latestClose === lowestClose) {
            day = "low"
        } else {
            day= "null"
        }

        for(let i=1; i<=5; i++) {
            const latestClose = bars[bars.length - i].ClosePrice;
            if (latestClose === highestClose) {
                week = "high"
                if(i==1) day = "high"
                break;
            } else if (latestClose === lowestClose) {
                week = "low"
                if(i==1) day = "low"
                break;
            } else {
                week= "null"
                if(i==1) day = "null"
            }
        }

        return { day, week }
    },

    preSet3: function (tickerList) {
        // MFI, Engulfing pattern
        let resList = []
        for (let t of tickerList) {
            let bars = t.bars, sym = t.ticker;
            if(bars.length <= 200) continue;
            if(trend.preSet3Filter(bars)) {
                let ssma = ta.getSMMA(bars, 100)
                ssma = ssma[ssma.length-1]
                let trend = bars[bars.length-1]>ssma._200? "Bullish" : "Bearish"
                resList.push({sym, trend})
            }
        }
        for(r of resList) console.log(r)
    },

    preSet3Filter: (bars) => {
        let close = bars[bars.length-1].ClosePrice
        let ssma = ta.getSMMA(bars, 100)
        let mfiList = ta.getMFI(bars)
        let engAlert = ta.detectEngulfingPattern(bars)

        // console.log([ssma[ssma.length-1] < close, engAlert, mfiList[mfiList.length-1]])

        // Bullish
        if(ssma[ssma.length-1] < close && engAlert=='Bullish' && (mfiList[mfiList.length-1] < 20 || mfiList[mfiList.length-2] < 20))return  {filter: true, trend: "Bullish"}
        // Bearish
        else if (ssma[ssma.length-1] > close && engAlert=='Bearish' && (mfiList[mfiList.length-1] > 80 || mfiList[mfiList.length-2] > 80)) return {filter: true, trend: "Bearish"}
        // neither
        else return {filter: false, trend: "None"}
    },

    preSet4: function (tickerList) {
        // MFI, Engulfing pattern
        let resList = []
        for (let t of tickerList) {
            let bars = t.bars, sym = t.ticker;
            if(bars.length <= 253) continue;
            if(trend.preSet4Filter(bars)) {
                let ma = ta.getEMA(bars, 200)
                ma = ma[ma.length-1]
                let trend = bars[bars.length-1]>ma._200? "Bullish" : "Bearish"
                resList.push({sym, trend})
            }
        }
        for(r of resList) console.log(r)
    },

    preSet4Filter: (bars) => {
        let close = bars[bars.length-1].ClosePrice
        let ma =  {
            _20 : ta.getEMA(bars.map(b=>b.ClosePrice), 20),
            _50 : ta.getEMA(bars.map(b=>b.ClosePrice), 50),
            _100 : ta.getEMA(bars.map(b=>b.ClosePrice), 100)
        }
        let change = {
            day : tools.pDiff( bars[bars.length-2].ClosePrice, close),
            week : tools.pDiff( bars[bars.length-6].ClosePrice, close),
            month: tools.pDiff( bars[bars.length-21].ClosePrice, close),
            year: tools.pDiff( bars[bars.length-251].ClosePrice, close)
        }



        // Bullish
        if(ma._20<close && ma._50<close && ma._100<close && change.day>0 && change.week>5 && change.month>20 && change.year>50)return  {filter: true, trend: "Bullish"}
        // Bearish
        else if (ma._20>close && ma._50>close && ma._100>close && change.day<0 && change.week<-5 && change.month<-15 && change.year<-30) return {filter: true, trend: 'Bearish'}
        // neither
        else return {filter: false, trend: 'None'}
    },

    preSet5Filter: (bars) => {
        if(bars.length<900) return false;
        let close = bars[bars.length-1].ClosePrice
        let lines = ta.getStochRSI(bars);
        let line = lines.line, signal = lines.signal
        let sigMA = ta.getSignalMovingAverage(bars)
        let heat = ta.heatmapVolumeColor(bars)


        // Bullish
        if(line[line.length-2]>80) {
            if(line[line.length-2]>=signal[signal.length-2] && line[line.length-1]<signal[signal.length-1] && sigMA[sigMA.length-1] < close && (heat=='Medium' || heat=='High'))
                return {filter: true, trend:'Bullish'};  
        }
        else if(line[line.length-2]<20) {
            if(line[line.length-2]<=signal[signal.length-2] && line[line.length-1]>signal[signal.length-1] && sigMA[sigMA.length-1] > close && (heat=='Medium' || heat=='High'))
            return {filter: true, trend:'Bearish'}
        }

        return {filter: false, trend:'None'}
    },

    preSet6Filter: (bars) => {
        if(bars.length<200) return false;
        let close = bars[bars.length-1].ClosePrice
        let superTrendData = ta.getSuperTrend(bars, {})
        let tramaList = ta.getTrama(bars)
        let osc = ta.getSuperTrendOscillator(bars)
        let superTrend = superTrendData.superTrend

        // console.log([close, superTrend[superTrend.length-1], tramaList[tramaList.length-1],  superTrend[superTrend.length-1]<close, tramaList[tramaList.length-1]<close, osc.osc[osc.osc.length-1]])
        if(superTrend[superTrend.length-1]<close && tramaList[tramaList.length-1]<close && osc.osc[osc.osc.length-1]==1) return {filter: true, trend:'Bullish'}

        if(superTrend[superTrend.length-1]>close && tramaList[tramaList.length-1]>close && osc.osc[osc.osc.length-1]==-1) return {filter: true, trend:'Bearish'}

        return {filter: false, trend:'None'}
    },

    preSet7Filter: (bars) => {
        if(bars.length<200) return false;
        let close = bars[bars.length-1].ClosePrice
        let open = bars[bars.length-1].OpenPrice
        let superTrendData = ta.getSuperTrend(bars, {atrPeriod: 12})
        let demaList = ta.getDEMAList(bars.map(b=>b.ClosePrice), 200)
        let dema = demaList[demaList.length-1]

        let superTrend = superTrendData.superTrend

        // bullish
        if(open<close && superTrend[superTrend.length-2]>close && superTrend[superTrend.length-1]<close && dema<close) return {filter: true, trend:'Bullish'}
        // bearish
        if( open>close &&superTrend[superTrend.length-2]<close && superTrend[superTrend.length-1]>close && dema>close) return {filter: true, trend:'Bearish'}

        return {filter: false, trend:'None'}
    },

    // HA candles
    preSet8Filter: (bars) => {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let last = candles[candles.length-1], last2 = candles[candles.length-2], last3 = candles[candles.length-3];

        // bullish
        if(last2.open<last2.close && last.low==last.open) {
            for (let i=2; i<100; i++) {
                let candle = candles[candles.length-i]
                if(candle.low==candle.open) return {filter: false, trend:'None'}
                if(candle.open>candle.close) return {filter: true, trend:'Bullish'}
            }
            return {filter: false, trend:'None'}
        } 
        // bearish
        if(last2.open>last2.close && last.high==last.open) {
            for (let i=2; i<100; i++) {
                let candle = candles[candles.length-i]
                if(candle.high==candle.open) return {filter: false, trend:'None'}
                if(candle.open<candle.close) return {filter: true, trend:'Bearish'}
            }
        }
        return {filter: false, trend:'None'}
    }
}

module.exports=trend