const ta = require("../../methods/ta");
const tools = require("../../methods/tools/tools");

haTrend = {
    _1 : function (bars) {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let last = candles[candles.length-1];

        // bullish
        if(last.low==last.open) return {filter: true, trend: "Bullish"}
        // bearish
        if(last.high==last.open) return {filter: true, trend: "Bearish"}

        return {filter: false, trend: "None"}
    },

    // First candle color
    _2: function (bars) {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let last = candles[candles.length-1], last2 = candles[candles.length-2];

        // bullish
        if(last.low==last.open && last2.open != last2.low)  {
            for(let i=2; i<50; i++) {
                let candle=candles[candles.length-i]
                if(candle.open == candle.low) return {filter: false, trend: "None"};
                if(candle.close<candle.open) return {filter: true, trend: "Bullish"}
            }
            return {filter: false, trend: "None"};
        }
        // bearish
        if(last.high==last.open && last2.open != last2.high) {
            for(let i=2; i<50; i++) {
                let candle=candles[candles.length-i]
                if(candle.open == candle.high) return {filter: false, trend: "None"};;
                if(candle.close>candle.open) return {filter: true, trend: "Bearish"}
            }
            return {filter: false, trend: "None"};
        } 
        return {filter: false, trend: "None"};
    },

    _3: function (bars) {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let last = candles[candles.length-1], last2 = candles[candles.length-2];
        let ema = ta.getEMA(candles.map(c=>c.close), 200)
        let stochRSI = ta.getStochRSI(candles.map(c=>{return {ClosePrice: c.close}}))
        let stoch = stochRSI.line, signal = stochRSI.signal
        let isLargerBody = Math.abs(last.open-last.close) > Math.abs(last2.open-last2.close)


        let isStochBelow = (stoch[stoch.length-1]<20 || signal[signal.length-1]<20 || stoch[stoch.length-2]<20 || signal[signal.length-2]<20 || stoch[stoch.length-3]<20 || signal[signal.length-3]<20)
        let isStochAbove = (stoch[stoch.length-1]>80 || signal[signal.length-1]>80 || stoch[stoch.length-2]>80 || signal[signal.length-2]>80)

        // console.log(last, ema, stoch[stoch.length-1], signal[signal.length-1], isLargerBody, isStochBelow, isStochAbove)


        let isBullishCandle = (last.low==last.open && last2.open < last2.close && last.close>ema && stoch[stoch.length-1]>signal[signal.length-1] && isStochBelow)
        let isBearishCandle = (last.high==last.open && last2.open > last2.close && last.close<ema && stoch[stoch.length-1]<signal[signal.length-1] && isStochAbove)
        // Bullish
        if((isBullishCandle || isBearishCandle) && isLargerBody) return {filter: true, trend: "Bullish"};
        return {filter: false, trend: "None"};
    },

    // Macd
    _4: function (bars) {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let last = candles[candles.length-1], last2=last = candles[candles.length-2]
        let macd = ta.getMacd(tools.haToBarTranslator(candles))
        let line=macd.macd, signal=macd.signalLine

        let isBullishCandle = (last.low==last.open && line>signal)
        let isBearishCandle = (last.high==last.open && line<signal)

        for(let i=3; i<100; i++) {
            let candle = candles[candles.length-i]
            let newCandle= candles.slice(0, -(i-1))
            let mac = ta.getMacd(tools.haToBarTranslator(newCandle))
            let l=mac.macd, s=mac.signalLine
            if(isBullishCandle) {
                if(l<s) return {filter: true, trend: "Bullish"};
                if(candle.open==candle.low) return {filter: false, trend: "None"};
            }
            if(isBearishCandle) {
                if(l>s) return {filter: true, trend: "Bearish"};
                if(candle.open==candle.high) return {filter: false, trend: "None"};
            }
        }

        return {filter: false, trend: "None"};
    },

    // Double supertrend
    _5: function (bars) {
        if(bars.length<200) return false;
        let candles = ta.getHeikinAshi(bars)
        let longST = ta.getSuperTrend(tools.haToBarTranslator(candles), {atrPeriod: 21, factor: 1})
        let shortST = ta.getSuperTrend(tools.haToBarTranslator(candles), {atrPeriod: 14, factor: 2})
        let last = candles[candles.length-1]
        
        let isBullishCandle = (last.low==last.open && line>signal)
        let isBearishCandle = (last.high==last.open && line<signal)

        if(isBullishCandle && isLargerBody) return {filter: true, trend: "Bullish"}
        if(isBearishCandle && isLargerBody) return {filter: true, trend: "Bearish"}
        return {filter: false, trend: "None"};
    },

    _6: function (bars) {
        let candles = ta.getHeikinAshi(bars)
        let {sXtrend, maXtrend, lXtrend } = ta.getXTrends(candles.map(c=>c.close))

        let getTrend = (trend) => trend[trend.length-1] >  trend[trend.length-2] ? "Bullish" : trend[trend.length-1] < trend[trend.length-2] ? "Bearish" : "None"
        
        let sTrend = getTrend(sXtrend)
        let maTrend = getTrend(maXtrend)
        let lTrend = getTrend(lXtrend)

        if((sTrend=="Bullish" && maTrend=="Bullish" && lTrend=="Bullish") || (sTrend=="Bearish" && maTrend=="Bearish" && lTrend=="Bearish")) {
            for(let i=2; i<100; i++) {
                let st = getTrend(sXtrend.slice(0, -i))
                let mt = getTrend(maXtrend.slice(0, -i))
                let lt = getTrend(lXtrend.slice(0, -i))

                if(sTrend=="Bullish" && (st=="Bearish" || mt=="Bearish" || lt=="Bearish")) return {filter: true, trend: "Bullish"}
                if(sTrend=="Bearish" && (st=="Bullish" || mt=="Bullish" || lt=="Bullish")) return {filter: true, trend: "Bearish"}
                if(sTrend=="Bullish" && (st=="Bullish" || mt=="Bullish" || lt=="Bullish")) return {filter: false, trend: "Bullish"}
                if(sTrend=="Bearish" && (st=="Bearish" || mt=="Bearish" || lt=="Bearish")) return {filter: false, trend: "Bearish"}
            }
        }
        return {filter: false, trend: "None"}
    },

    _7 : function (bars) {
        let candles = ta.getHeikinAshi(bars)
        let {line, signal} = ta.getStochRSI(candles.map(c=>c.close))
        let close = candles[candles.length-1]
        let close2 = candles[candles.length-2]
        let ema = ta.getEMA(candles.map(c=>c.close), 200)

        let isBullish = close.low==close.open && close2.open<close2.close && ema<close.close && line[line.length-1]>signal[signal.length-1] && (line[line.length-2]<20 || line[line.length-3]<20)
        let isBearish = close.high==close.open && close2.open>close2.close && ema>close.close && line[line.length-1]<signal[signal.length-1] && (line[line.length-2]>80 || line[line.length-3]>80)

        if(isBullish || isBearish) {
            return {filter:true, trend: isBullish?"Bullish" : isBearish? "Bearish" : "None"}
        }
        return {filter: false, trend: "None"}
    },

    _8 : function (bars) {
        let candles = ta.getHeikinAshi(bars)
        let {line, signal} = ta.getStochRSI(candles.map(c=>c.close))
        let close = candles[candles.length-1]
        let close2 = candles[candles.length-2]

        let isBullish = close.low==close.open && close2.open<close2.close  && line[line.length-1]>signal[signal.length-1] && (line[line.length-2]<20 || line[line.length-3]<20)
        let isBearish = close.high==close.open && close2.open>close2.close  && line[line.length-1]<signal[signal.length-1] && (line[line.length-2]>80 || line[line.length-3]>80)

        if(isBullish || isBearish) {
            return {filter:true, trend: isBullish?"Bullish" : isBearish? "Bearish" : "None"}
        }
        return {filter: false, trend: "None"}
    },

}

module.exports=haTrend

