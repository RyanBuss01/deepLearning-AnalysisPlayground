const tools = require("./tools/tools")

var ta = {
  singleTicker: async function(tickerList, tInput='') {
      let bars, index, ticker = 'AAPL'
      if(tInput!='') ticker=tInput
      else {
        let t = prompt("Enter Ticker (AAPL): ")
        if(t!='') ticker=t
        console.clear()
      }

        let element = tickerList.find(e=>e.ticker==ticker.toUpperCase())
        if(element) {
        bars = element.bars
        index = element.index
        }
        else {
          bars = await funcsAlpaca.getBars(alpaca=alpacaR, ticker, {})
          if(bars) console.log(bars.length)
          else console.log("'bars' is not defined")
          index='None'
        }
        let json = toolsTA.getStockJson(bars, ticker, {override:true, index:index, optimize:false})
  
        // console.log({bars: bars.slice(0,-(14)).slice(-14).map(b=>b.Timestamp), nextdays : bars.slice(-(14)).map(b=>b.Timestamp)})
        console.log(json)

        if(element) a.actions.selectedActions(json, bars)
        else a.actions.menuLoop(tickerList)
  },

  getSMA(data, period) {
    if (data.length < period) {
        return
    }

    let sum = 0;
    for (let i = data.length - period; i < data.length; i++) {
        sum += data[i];
    }

    return sum / period;
  },

  getSmaList: function (data, period) {
      let sma = [];
      for (let i = period - 1; i < data.length; i++) {
          let sum = 0;
          for (let j = 0; j < period; j++) {
              sum += data[i - j];
          }
          sma.push(sum / period);
      }
      return sma;
  },

  getStdDev: function (data, mean, period) {
    const squaredDiffs = data.slice(-period).map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, value) => sum + value, 0) / period;
    return Math.sqrt(avgSquaredDiff);
  },

  getEMA : function (data, period=200) {
    const smoothingFactor = 2 / (period + 1);
  
    // Calculate the initial SMA
    const initialSMA = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
    // Calculate the initial EMA using SMA
    let previousEMA = initialSMA;
  
    // Calculate EMA for the remaining prices
    for (let i = period; i < data.length; i++) {
      const currentPrice = data[i];
      const ema = (currentPrice * smoothingFactor)  + (previousEMA * (1 -smoothingFactor));
      previousEMA = ema;
    }
  
    return previousEMA;
  },

  getEMAList: function (prices, length) {
    let k = 2 / (length + 1);
    let ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }

    return ema;
  },

  volumeBreak: function (volumes, thres) {
    const rsivol = this.getSmoothRSI(volumes, 14);
    const osc = rsivol[rsivol.length - 1];  // Assuming HMA is equal to last RSI value for simplicity
    return osc > thres;
  },
  
  volatilityBreak: function (highPrices, lowPrices, closePrices, volmin, volmax) {
    const atrMin = this.calculateATR(highPrices, lowPrices, closePrices, volmin);
    const atrMax = this.calculateATR(highPrices, lowPrices, closePrices, volmax);
    return atrMin[atrMin.length - 1] > atrMax[atrMax.length - 1];
  },

  getSmoothRSI: function (closePrices, period) {
    let gain = 0, loss = 0;
    let rsis = [0]; // Assuming RSI is 0 for the first data point
    for (let i = 1; i < closePrices.length; i++) {
      const difference = closePrices[i] - closePrices[i - 1];
      if (difference >= 0) {
        gain = (gain * (period - 1) + difference) / period;
        loss = loss * (period - 1) / period;
      } else {
        gain = gain * (period - 1) / period;
        loss = (loss * (period - 1) - difference) / period;
      }
      const rs = gain / loss;
      const rsi = 100 - (100 / (1 + rs));
      rsis.push(rsi);
    }
    return rsis;
  },

  calculateATR: function (highPrices, lowPrices, closePrices, period) {
    let atr = [0];
    for (let i = 1; i < closePrices.length; i++) {
      const high = highPrices[i];
      const low = lowPrices[i];
      const closePrev = closePrices[i - 1];
      const tr = Math.max(high - low, Math.abs(high - closePrev), Math.abs(low - closePrev));
      const atrValue = ((atr[atr.length - 1] * (period - 1)) + tr) / period;
      atr.push(atrValue);
    }
    return atr;
  },

  getSMMA: function (bars, period) {
    let closes = bars.map(b=>b.ClosePrice)
    let smma = Array(closes.length).fill(null);
    let sum = 0;

    
  
    // Calculate initial SMA to start SMMA
    for (let i = 0; i < period; i++) {
      sum += closes[i];
    }
    smma[period - 1] = sum / period;
  
    // Calculate subsequent SMMA values
    for (let i = period; i < closes.length; i++) {
      smma[i] = (smma[i - 1] * (period - 1) + closes[i]) / period;
    }

    return smma;
  },

  getMFI: function (bars, period = 14) {
    let positiveFlow = [];
    let negativeFlow = [];
  
    for (let i = 1; i < bars.length; i++) {
      const currentBar = bars[i];
      const lastBar = bars[i - 1];
      const typicalPrice = (currentBar.HighPrice + currentBar.LowPrice + currentBar.ClosePrice) / 3;
      const lastTypicalPrice = (lastBar.HighPrice + lastBar.LowPrice + lastBar.ClosePrice) / 3;
      const rawMoneyFlow = typicalPrice * currentBar.Volume;
      
      if (typicalPrice > lastTypicalPrice) {
        positiveFlow.push(rawMoneyFlow);
        negativeFlow.push(0);
      } else if (typicalPrice < lastTypicalPrice) {
        positiveFlow.push(0);
        negativeFlow.push(rawMoneyFlow);
      } else {
        positiveFlow.push(0);
        negativeFlow.push(0);
      }
    }
  
    let mfi = [];
    for (let i = period - 1; i < positiveFlow.length; i++) {
      const positiveSum = positiveFlow.slice(i + 1 - period, i + 1).reduce((acc, val) => acc + val, 0);
      const negativeSum = negativeFlow.slice(i + 1 - period, i + 1).reduce((acc, val) => acc + val, 0);
  
      if (negativeSum === 0) {
        mfi.push(100); // Assuming positive money flow implies strong buying pressure, MFI is set to 100
      } else {
        const moneyFlowRatio = positiveSum / negativeSum;
        const moneyFlowIndex = 100 - (100 / (1 + moneyFlowRatio));
        mfi.push(moneyFlowIndex);
      }
    }
  
    // This will align the MFI values with their corresponding periods
    return Array(period - 1).fill(null).concat(mfi);
  },

  detectEngulfingPattern : function (bars) {
    if (bars.length < 2) {
      // Not enough data to compare
      return null;
    }
  
    // Get the last two candles
    const previousBar = bars[bars.length - 2];
    const currentBar = bars[bars.length - 1];
  
    // Define bullish and bearish engulfing patterns
    const bullishEngulfing =
      currentBar.OpenPrice <= previousBar.ClosePrice &&
      currentBar.OpenPrice < previousBar.OpenPrice &&
      currentBar.ClosePrice > previousBar.OpenPrice;
  
    const bearishEngulfing =
      currentBar.OpenPrice >= previousBar.ClosePrice &&
      currentBar.OpenPrice > previousBar.OpenPrice &&
      currentBar.ClosePrice < previousBar.OpenPrice;
  
    // Return the detected pattern
    if (bullishEngulfing) {
      return 'Bullish';
    } else if (bearishEngulfing) {
      return 'Bearish';
    } else {
      return 'None';
    }
  },

  getRSI: function(closePrices, period=14) {
    let gains = 0;
    let losses = 0;
    let rsis = Array(period).fill(0);

    // First average gain/loss
    for (let i = 1; i <= period; i++) {
        const difference = closePrices[i] - closePrices[i - 1];
        if (difference > 0) gains += difference;
        else losses -= difference;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Subsequent average gain/loss and RSI calculation
    for (let i = period + 1; i < closePrices.length; i++) {
        const difference = closePrices[i] - closePrices[i - 1];
        if (difference > 0) {
            avgGain = (avgGain * (period - 1) + difference) / period;
            avgLoss = avgLoss * (period - 1) / period;
        } else {
            avgGain = avgGain * (period - 1) / period;
            avgLoss = (avgLoss * (period - 1) - difference) / period;
        }

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsis.push(rsi);
    }

    return rsis[rsis.length-1];
  },

  getRSIList: function (closePrices, period) {
    let gains = 0;
    let losses = 0;
    let rsis = Array(period).fill(0);

    // First average gain/loss
    for (let i = 1; i <= period; i++) {
        const difference = closePrices[i] - closePrices[i - 1];
        if (difference > 0) gains += difference;
        else losses -= difference;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Subsequent average gain/loss and RSI calculation
    for (let i = period + 1; i < closePrices.length; i++) {
        const difference = closePrices[i] - closePrices[i - 1];
        if (difference > 0) {
            avgGain = (avgGain * (period - 1) + difference) / period;
            avgLoss = avgLoss * (period - 1) / period;
        } else {
            avgGain = avgGain * (period - 1) / period;
            avgLoss = (avgLoss * (period - 1) - difference) / period;
        }

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsis.push(rsi);
    }

    return rsis;
  },

  getCCI: function (bars, period) {
    let highs = bars.map(b=>b.high), lows = bars.map(b=>b.low), closes = bars.map(b=>b.close)
    const tp = []; // Typical Price
    const sma = []; // Simple Moving Average of TP
    let meanDeviation = 0;

    for (let i = 0; i < highs.length; i++) {
        tp.push((highs[i] + lows[i] + closes[i]) / 3);
    }

    for (let i = 0; i < tp.length; i++) {
        if (i >= period - 1) {
            const tpSlice = tp.slice(i - period + 1, i + 1);
            sma.push(avg(tpSlice));
            const smaLast = sma[sma.length - 1];
            meanDeviation += tpSlice.reduce((acc, val) => acc + Math.abs(val - smaLast), 0) / period;
        }
    }

    const cci = (tp[tp.length - 1] - sma[sma.length - 1]) / (0.015 * meanDeviation);
    return cci;
  },

  getCCIList: function (bars, period) {
    const ccis = Array(period - 1).fill(0);
    const sma = [];

    for (let i = 0; i < bars.length; i++) {
        const tp = (bars[i].high + bars[i].low + bars[i].close) / 3;
        sma.push(tp);

        if (i >= period - 1) {
            const mean = sma.slice(-period).reduce((a, b) => a + b, 0) / period;
            const meanDeviation = sma.slice(-period)
                                  .reduce((sum, value) => sum + Math.abs(value - mean), 0) / period;
            const cci = (tp - mean) / (0.015 * meanDeviation);
            ccis.push(cci);
        }
    }

    return ccis;
},

  getRoc :function (data, period) {
    const change = data[data.length - 1] - data[data.length - period - 1];
    return (change / data[data.length - period - 1]) * 100;
  },

  getROCList: function (prices, period) {
    const rocs = Array(period).fill(0);

    for (let i = period; i < prices.length; i++) {
        const change = prices[i] - prices[i - period];
        rocs.push((change / prices[i - period]) * 100);
    }

    return rocs;
},

  getMom: function (prices, period) {
    return prices[prices.length - 1] - prices[prices.length - period - 1];
  },

  getMOMList: function (prices, period) {
    const moms = Array(period).fill(0);

    for (let i = period; i < prices.length; i++) {
        moms.push(prices[i] - prices[i - period]);
    }

    return moms;
},

  getStochRSI: function (data, lengthRSI=14, lengthStoch=14, smoothK=3, smoothD=3) {
    const rsi = this.getRSIList(data, lengthRSI);
    let stochRsi = [];
    for (let i = lengthStoch - 1; i < rsi.length; i++) {
        const rsiWindow = rsi.slice(i - lengthStoch + 1, i + 1);
        const rsiHigh = Math.max(...rsiWindow);
        const rsiLow = Math.min(...rsiWindow);
        stochRsi.push((rsi[i] - rsiLow) / (rsiHigh - rsiLow) * 100);
    }
    const kLine = this.getSmaList(stochRsi, smoothK);
    const dLine = this.getSmaList(kLine, smoothD);
    return {line: kLine, signal: dLine };
  },

  getSignalMovingAverage: function (bars, length=50) {
    let prices = bars.map(b=>b.ClosePrice)

    function correlation(x, y, period) {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
      for (let i = 0; i < period; i++) {
          sumX += x[i];
          sumY += y[i];
          sumXY += x[i] * y[i];
          sumX2 += x[i] * x[i];
          sumY2 += y[i] * y[i];
      }
      const n = period;
      const denominator = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));
      if (denominator === 0) return 0;
      return (sumXY - sumX * sumY / n) / denominator;
  }

    let ma = 0, os = 0, target = 0;
    let signalMA = [];

    for (let i = length; i < prices.length; i++) {
        target = this.getSMA(prices.slice(i - length + 1, i + 1), length);
        let abs_diff = Math.abs(target - this.getSMA(prices.slice(i - length, i), length));
        let r2 = Math.pow(correlation(prices.slice(i - length + 1, i + 1), Array.from({length: length}, (_, k) => k + i - length + 1), length), 2);

        os = r2 > 0.5 ? Math.sign(prices[i - 1] - this.getSMA(prices.slice(i - length - 1, i), length)) : os;
        ma = r2 > 0.5 ? r2 * target + (1 - r2) * (signalMA.length > 0 ? signalMA[signalMA.length - 1] : target) : (signalMA.length > 0 ? signalMA[signalMA.length - 1] : 0) - abs_diff * os;

        signalMA.push(ma);
    }

    return signalMA;
  },

  heatmapVolumeColor: function (bars, length=800, slength=610) {
    let volumeData = bars.map(b=>b.Volume)
    let thresholdExtraHigh=4, thresholdHigh=2.5, thresholdMedium=1, thresholdNormal=-0.5
    const mean = this.getSMA(volumeData.slice(), length);
    const std = this.getStdDev(volumeData, mean, slength);
    const stdbar = (volumeData[volumeData.length - 1] - mean) / std;

    let heat;
    if (stdbar > thresholdExtraHigh) heat = 'ExHigh'
    else if (stdbar > thresholdHigh) heat = 'High'
    else if (stdbar > thresholdMedium) heat =  'Medium'
    else if (stdbar > thresholdNormal) heat = 'Normal'
    else heat = 'Low'

    return heat;
  },

  getTrueRange : function (high, low, prevClose) {
    return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  },

  getATR: function (bars, period=14) {
    let highs = bars.map(b => b.HighPrice);
    let lows = bars.map(b => b.LowPrice);
    let closes = bars.map(b => b.ClosePrice);

    let trs = [this.getTrueRange(highs[0], lows[0], closes[0])];
    for (let i = 1; i < highs.length; i++) {
        trs.push(this.getTrueRange(highs[i], lows[i], closes[i - 1]));
    }

    let atr = new Array(period - 1).fill(null); // Initialize first 'period - 1' values as null
    atr.push(trs.slice(0, period).reduce((a, b) => a + b, 0) / period);
    for (let i = period; i < trs.length; i++) {
        atr.push((atr[atr.length - 1] * (period - 1) + trs[i]) / period);
    }
    return atr[atr.length-1];
  },

  getAtrList: function (bars, period) {
    let highs = bars.map(b => b.HighPrice);
    let lows = bars.map(b => b.LowPrice);
    let closes = bars.map(b => b.ClosePrice);

    let trs = [this.getTrueRange(highs[0], lows[0], closes[0])];
    for (let i = 1; i < highs.length; i++) {
        trs.push(this.getTrueRange(highs[i], lows[i], closes[i - 1]));
    }

    let atr = new Array(period - 1).fill(null); // Initialize first 'period - 1' values as null
    atr.push(trs.slice(0, period).reduce((a, b) => a + b, 0) / period);
    for (let i = period; i < trs.length; i++) {
        atr.push((atr[atr.length - 1] * (period - 1) + trs[i]) / period);
    }
    return atr;
  },

  getSuperTrend: function (bars, {atrPeriod=10, factor=3}) {
      let highs = bars.map(b=>b.HighPrice)
      let lows = bars.map(b=>b.LowPrice)
      let closes = bars.map(b=>b.ClosePrice)

      const atr = this.getAtrList(bars, atrPeriod);
      let superTrend = [], upperBand = [], lowerBand = [], trend = [];

      upperBand[0] = (highs[0] + lows[0]) / 2 + factor * atr[0];
    lowerBand[0] = (highs[0] + lows[0]) / 2 - factor * atr[0];
    trend[0] = closes[0] > upperBand[0] ? 1 : -1;
    superTrend[0] = trend[0] === 1 ? upperBand[0] : lowerBand[0];

    for (let i = 1; i < bars.length; i++) {
      // Calculate basic upper and lower bands
      upperBand[i] = (highs[i] + lows[i]) / 2 + factor * atr[i];
      lowerBand[i] = (highs[i] + lows[i]) / 2 - factor * atr[i];

      // Adjust bands if needed
      if (closes[i - 1] <= upperBand[i - 1]) {
          upperBand[i] = Math.min(upperBand[i], upperBand[i - 1]);
      }

      if (closes[i - 1] >= lowerBand[i - 1]) {
          lowerBand[i] = Math.max(lowerBand[i], lowerBand[i - 1]);
      }

      // Trend determination and SuperTrend calculation
      if (closes[i] > upperBand[i - 1]) {
          trend[i] = 1;
      } else if (closes[i] < lowerBand[i - 1]) {
          trend[i] = -1;
      } else {
          trend[i] = trend[i - 1];
      }

      if (trend[i] === trend[i - 1]) {
          superTrend[i] = trend[i] === 1 ? lowerBand[i] : upperBand[i];
      } else {
          superTrend[i] = trend[i] === 1 ? upperBand[i] : lowerBand[i];
      }
  }

      return {upperBand, lowerBand, superTrend}
  },

  getTrama : function (bars, period=99) {
    let prices = bars.map(b=>b.ClosePrice)
    let ama = [];
    let highest = [], lowest = [], hh = [0], ll = [0], tc = [0];

    for (let i = 0; i < prices.length; i++) {
        highest.push(i >= period - 1 ? Math.max(...prices.slice(i - period + 1, i + 1)) : prices[i]);
        lowest.push(i >= period - 1 ? Math.min(...prices.slice(i - period + 1, i + 1)) : prices[i]);
    }

    for (let i = 1; i < prices.length; i++) {
        hh.push(highest[i] != highest[i - 1] ? 1 : 0);
        ll.push(lowest[i] != lowest[i - 1] ? -1 : 0);
        tc.push(hh[i] || ll[i] ? 1 : 0);
    }

    for(let i=0; i<=period; i++) ama.push(prices[i])

    let tcSma = this.getSmaList(tc, period);
    for (let i = 1 + period; i < prices.length; i++) {
        tc[i] = Math.pow(tcSma[i - period], 2);
        ama.push(ama[i - 1] + tc[i] * (prices[i] - ama[i - 1]));
    }


    return ama;

  },

  getSuperTrendOscillator: function (bars, period=6, smooth=72) {
    let osc = [], ama = [], hist = [];
    let closes = bars.map(b => b.ClosePrice);
    let superTrendData = this.getSuperTrend(bars, {full: true})

    for (let i = 0; i < bars.length; i++) {
        let currentClose = closes[i];
        let upperBand = superTrendData.upperBand[i];
        let lowerBand = superTrendData.lowerBand[i]
        let superTrend = superTrendData.superTrend[i]

        // Calculate Oscillator
        osc[i] = (currentClose - superTrend) / (upperBand - lowerBand);
        osc[i] = Math.max(Math.min(osc[i], 1), -1); // Clamp value between -1 and 1

        // Calculate AMA
        let alpha = Math.pow(osc[i], 2) / period;
        ama[i] = i === 0 ? osc[i] : ama[i - 1] + alpha * (osc[i] - ama[i - 1]);

    }

    // Calculate Histogram as EMA of (osc - ama)
    // hist = this.getEMA(osc.map((o, i) => o - ama[i]), smooth);

    return { osc, ama, hist };
  },

  getMacd : function(bars) {
      let closePrices=bars.map(b=>b.ClosePrice)
      const fastLength = 12; // Fast EMA period
      const slowLength = 26; // Slow EMA period
      const signalSmoothing = 9; // Signal smoothing period
  
      let macdLine = []
     
  
      for(i=signalSmoothing; i>=0; i--) {
        const pricesSubset = i === 0 ? closePrices : closePrices.slice(0, -i);
        
        const fastEMA = this.getEMA(pricesSubset, fastLength);
        const slowEMA = this.getEMA(pricesSubset, slowLength);
        const macd = fastEMA - slowEMA;
        macdLine.push(macd)
    }
    // Calculate Signal Line
    const signalLine = this.getEMA(macdLine.slice(-signalSmoothing), signalSmoothing);
  
    // Calculate Histogram
    const histogram = macdLine[macdLine.length-1] - signalLine;
    
      return {
        signalLine: Number(signalLine.toFixed(3)),
        macd: Number(macdLine[macdLine.length-1].toFixed(3)),
        histogram: Number(histogram.toFixed(3))
      };
  },

  getDEMAList: function (data, period=200) {
    let e1 = this.getEMAList(data, period);
    let e2 = this.getEMAList(e1, period);

    let dema = [];
    for (let i = 0; i < data.length; i++) {
        dema.push(2 * e1[i] - e2[i]);
    }

    return dema;
  },

  getHeikinAshi: function (bars) {
    let candles = [];
    let previousHAOpen = (bars[0].OpenPrice + bars[0].ClosePrice) / 2;
    let previousHAClose = (bars[0].OpenPrice + bars[0].HighPrice + bars[0].LowPrice + bars[0].ClosePrice) / 4;

    for (let bar of bars) {
        let HAClose = (bar.OpenPrice + bar.HighPrice + bar.LowPrice + bar.ClosePrice) / 4;
        let HAOpen = (previousHAOpen + previousHAClose) / 2;
        let HAHigh = Math.max(bar.HighPrice, HAOpen, HAClose);
        let HALow = Math.min(bar.LowPrice, HAOpen, HAClose);

        candles.push({
            open: HAOpen, 
            close: HAClose, 
            high: HAHigh, 
            low: HALow
        });

        previousHAOpen = HAOpen;
        previousHAClose = HAClose;
    }

    return candles;
  },

  isDoji: function (candle, threshold = 2) {
    const { high, low } = candle;

    // Calculate the absolute difference between the open and close
    const difference = Math.abs(tools.pDiff(high, low));

    // Check if the difference is less than or equal to the threshold
    return difference <= threshold;
  },

  t3: function (src, len) {
    let b = 0.7;
    let c1 = -b * b * b;
    let c2 = 3 * b * b + 3 * b * b * b;
    let c3 = -6 * b * b - 3 * b - 3 * b * b * b;
    let c4 = 1 + 3 * b + b * b * b + 3 * b * b;

    let ema1 = this.getEMAList(src, len);
    let ema2 = this.getEMAList(ema1, len);
    let ema3 = this.getEMAList(ema2, len);
    let ema4 = this.getEMAList(ema3, len);
    let ema5 = this.getEMAList(ema4, len);
    let ema6 = this.getEMAList(ema5, len);

    let nT3Average = src.map((_, i) => 
        c1 * ema6[i] + c2 * ema5[i] + c3 * ema4[i] + c4 * ema3[i]
    );

    return nT3Average;
  },

  getXTrends: function (closePrices) {
    let short_l1=5, short_l2=20, short_l3=15, long_l1=20, long_l2=15
    let emaShort1 = this.getEMAList(closePrices, short_l1);
    let emaShort2 = this.getEMAList(closePrices, short_l2);
    let emaLong1 = this.getEMAList(closePrices, long_l1);
    let shortTermXtrender = this.getRSIList(closePrices.map((price, index) => emaShort1[index] - emaShort2[index]), short_l3).map(x => x - 50);
    let longTermXtrender = this.getRSIList(closePrices.map((price, index) => emaLong1[index]), long_l2).map(x => x - 50);


    let maShortTermXtrender = this.t3(shortTermXtrender, 5);

    return { sXtrend: shortTermXtrender, maXtrend: maShortTermXtrender, lXtrend: longTermXtrender };
}


      


}

module.exports=ta