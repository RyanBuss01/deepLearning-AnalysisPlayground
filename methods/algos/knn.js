const ta = require("../ta");
const tools = require("../tools/tools");

const BUY = 1;
const SELL = -1;
const HOLD = 0;


let knn = {
    runner: function (bars) {
        let candles = ta.getHeikinAshi(bars)
         // Constants and placeholders for calculations
    const K = 63;
    const k = Math.floor(Math.sqrt(K));
    const holding_p = 1; // Placeholder for holding period
    const slow = 28;
    const fast=14;
    const tthres = 99.9; // Placeholder for time threshold

    // Placeholder functions for calculations
    const rs = ta.getRSIList(candles.map(c=>c.close), slow);
    const rf = ta.getRSIList(candles.map(c=>c.close), fast);
    const cs = ta.getCCIList(candles, slow)
    const cf = ta.getCCIList(candles, fast)
    const os = ta.getROCList(candles.map(c=>c.close), slow)
    const of = ta.getROCList(candles.map(c=>c.close), fast)
    const momSlow = ta.getMOMList(candles.map(c => c.close), slow);
    const momFast = ta.getMOMList(candles.map(c => c.close), fast);
    const ms = this.scale(momSlow, candles.map(c => c.close), 63).map(v => v * 100);
    const mf = this.scale(momFast, candles.map(c => c.close), 63).map(v => v * 100);

    const avgS = this.avg(rs, cs, os, ms)
    const avgF = this.avg(rf, cf, of, mf)

    let predictions = this.kNNPrediction(avgS, avgF, candles.map(c=>c.close), k)
    let prediction = tools.sum(predictions)

    let signal = prediction>0 ? 1 : prediction<0 ? -1 : 0

    // add filters


    const startLongTrade = signal == 1;
    const startShortTrade = signal == -1;

    return startLongTrade || startShortTrade;
    },

    kNNPrediction: function (avgS, avgF, closePrices, k) {
        const classes = this.classify(closePrices);
        const predictions = [];
    
        for (let i = 0; i < avgS.length; i++) {
            let neighbors = [];
            for (let j = 0; j < i; j++) {
                const distance = Math.sqrt(Math.pow(avgS[i] - avgS[j], 2) + Math.pow(avgF[i] - avgF[j], 2));
                neighbors.push({ distance, class: classes[j] });
            }
    
            neighbors = neighbors.sort((a, b) => a.distance - b.distance).slice(0, k);
            const prediction = neighbors.reduce((acc, neighbor) => acc + neighbor.class, 0);
            predictions.push(prediction > 0 ? BUY : prediction < 0 ? SELL : HOLD);
        }
    
        return predictions;
    },

    scale: function (values, prices, period) {
        const scaledValues = Array(values.length).fill(0);
    
        for (let i = period - 1; i < values.length; i++) {
            const recentPrices = prices.slice(i - period + 1, i + 1);
            const lowest = Math.min(...recentPrices);
            const highest = Math.max(...recentPrices);
            scaledValues[i] = (values[i] - lowest) / (highest - lowest);
        }
    
        return scaledValues;
    },

    avg: function (r,c,o,m) {
        let avg=[]
        for(let i =0; i<r.length; i++) {
            if(r==0 || c==0 || o==0 || m==0) avg.push(0)
            else avg.push(tools.mean([r[i], c[i], o[i], m[i]]))
        }

        return avg
    },

    
// Assuming closePrices is an array of closing prices
    classify: function (closePrices) {
        return closePrices.map((close, index) => {
            if (index === 0) return HOLD;
            return closePrices[index - 1] < close ? BUY :
                closePrices[index - 1] > close ? SELL : HOLD;
        });
    }
}

module.exports=knn