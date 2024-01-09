const ta = require('../ta')

let toolsKNN = {

    getBarColor: function (bars)  {
      // Initialize variables
      let pDirStrikeDup = 0;
      let tDirUpDup = true;
    
      // Most recent close price
      let pLast = bars[0].ClosePrice; // Initialize with the first close price
      
      // Assuming nStrike is 2 as in the Pine Script
      const nStrike = 2;
    
      // Iterate through the bars to calculate pDirStrikeDup and tDirUpDup
      for (let i = 1; i < bars.length; i++) {
        let src = bars[i].ClosePrice;
        
        // Calculate tDirUpDup based on src and pLast
        tDirUpDup = src > pLast;
        
        // Calculate pDirStrikeDup using src and pLast
        if (tDirUpDup && src > pLast) {
            pDirStrikeDup++;
        } else if (!tDirUpDup && src < pLast) {
            pDirStrikeDup++;
        } else {
            pDirStrikeDup = 0; // Reset if conditions are not met
        }
        
        // Update pLast for the next bar
        pLast = src;
    }
      console.log(pLast, pDirStrikeDup, tDirUpDup, nStrike)
    
      // Determine bar color based on pDirStrikeDup and tDirUpDup
      let colorTrend = 'orange'; // Default color
      if (pDirStrikeDup >= nStrike) {
        colorTrend = tDirUpDup ? 'green' : 'red';
      }
    
      return colorTrend; // Return the color
    },

    getInterTrend: function (
        src, upB, lowB, pLast, tDirUp, pDirStrike, isPFound, isHighP, nStrike, rPerOffset, depth
      ) {
        // Initialize returned variables with placeholder values
        let midBDup = null;
        let upBDup = null;
        let lowBDup = null;
        let pDirStrikeDup = null;
        let tDirUpDup = null;
      
        // Your calculations here, for example:
        midBDup = this.calculateMidB(upB, lowB);
        upBDup = this.calculateUpB(src);
        lowBDup = this.calculateLowB(src);
        pDirStrikeDup = this.calculatePDirStrike(src, upB, lowB, tDirUp)
        tDirUpDup = this.calculateTDirUp(src, pLast);
      
        // Assuming that all the calculation functions set the values for midBDup, upBDup, lowBDup, pDirStrikeDup, tDirUpDup
      
        return [midBDup, upBDup, lowBDup, pDirStrikeDup, tDirUpDup];
      },


      calculateMidB: function (upB, lowB) {
        return (upB + lowB) / 2;
      },
      
      // Calculate the Upper Band (Assuming Bollinger Band-like calculation)
      calculateUpB: function (src, windowSize = 20, multiplier = 2) {
        const avg = average(src, windowSize);
        const stdDev = standardDeviation(src, windowSize);
        return avg + stdDev * multiplier;
      },
      
      // Calculate the Lower Band (Assuming Bollinger Band-like calculation)
      calculateLowB: function (src, windowSize = 20, multiplier = 2) {
        const avg = average(src, windowSize);
        const stdDev = this.standardDeviation(src, windowSize);
        return avg - stdDev * multiplier;
      },
      
      // Calculate the PDirStrike (Direction Strike)
      calculatePDirStrike: function (src, upB, lowB, tDirUp) {
        if (src > upB && tDirUp) {
          return 1;
        }
        if (src < lowB && !tDirUp) {
          return -1;
        }
        return 0;
      },
      
      // Calculate the TDirUp (Trend Direction Up)
      calculateTDirUp: function (src, pLast) {
        return src > pLast;
      },
      
      // Helper: Calculate average over a window size
      average: function (array, windowSize) {
        const sum = array.slice(-windowSize).reduce((acc, val) => acc + val, 0);
        return sum / windowSize;
      },
      
      // Helper: Calculate standard deviation over a window size
      standardDeviation: function (array, windowSize) {
        const avg = average(array, windowSize);
        const sumOfSquares = array.slice(-windowSize).reduce((acc, val) => acc + Math.pow(val - avg, 2), 0);
        return Math.sqrt(sumOfSquares / windowSize);
      },

      calculateSupertrend: function (bars, atrPeriod=10, multiplier=3) {
        let atr = 0;
        let prevClose = 0;
        let supertrend = [];
      
        let prevFUB = 0;
        let prevFLB = 0;
      
        for (let i = 0; i < bars.length; i++) {
          const { HighBars, LowBars, OpenPrice, ClosePrice, Volume } = bars[i];
      
          const tr = Math.max(HighBars - LowBars, Math.abs(HighBars - prevClose), Math.abs(prevClose - LowBars));
      
          atr = ((atr * (atrPeriod - 1)) + tr) / atrPeriod;
          const bub = ((HighBars + LowBars) / 2) + (multiplier * atr);
          const blb = ((HighBars + LowBars) / 2) - (multiplier * atr);
      
          let fub = 0;
          let flb = 0;
      
          if (ClosePrice > prevFUB || prevFUB === 0) {
            fub = Math.min(bub, prevFUB);
          } else {
            fub = bub;
          }
      
          if (ClosePrice < prevFLB || prevFLB === 0) {
            flb = Math.max(blb, prevFLB);
          } else {
            flb = blb;
          }
      
          let currentSupertrend = 0;
      
          if (ClosePrice <= prevFUB) {
            currentSupertrend = fub;
          }
      
          if (ClosePrice >= prevFLB) {
            currentSupertrend = flb;
          }
      
          supertrend.push(currentSupertrend);
      
          prevClose = ClosePrice;
          prevFUB = fub;
          prevFLB = flb;
        }
      
        return supertrend;
      },

      isSideways: function (bars, period) {
        if (bars.length < period) {
          return false;
        }
      
        let sum = 0;
        let sumOfSquares = 0;
      
        for (let i = 0; i < period; i++) {
          sum += bars[i].ClosePrice;
          sumOfSquares += bars[i].ClosePrice * bars[i].ClosePrice;
        }
      
        const mean = sum / period;
        const variance = (sumOfSquares / period) - (mean * mean);
        const standardDeviation = Math.sqrt(variance);
      
        const threshold = mean * 0.02;  // Example threshold, can be adjusted
        return standardDeviation < threshold;
      },

      filter: function (bars) {
        let isSideSD = toolsKNN.isSideways(bars, 20)
        let isSideMA = toolsKNN.isSidewaysMovingAverage(bars, 20, 50, 0.01)
        let isSideBB = toolsKNN.isSidewaysBollingerBands(bars, 20, 2, 0.02)

        return (isSideSD || isSideMA || isSideBB)
      },

      emaFilter: function (bars, signal) {

        let ema200 = ta.getEMA(bars.map(b=>b.ClosePrice), 200)
        let ema100 = ta.getEMA(bars.map(b=>b.ClosePrice), 100)
        let ema50 = ta.getEMA(bars.map(b=>b.ClosePrice), 50)
        let ema20 = ta.getEMA(bars.map(b=>b.ClosePrice), 20)

        return ((signal=='Bullish' && bars[bars.length-1].ClosePrice > ema50 && bars[bars.length-1].ClosePrice > ema20 && bars[bars.length-1].ClosePrice > ema100)
        || (signal=='Bearish' && bars[bars.length-1].ClosePrice < ema50 && bars[bars.length-1].ClosePrice < ema20 && bars[bars.length-1].ClosePrice < ema100))
      },

      isSidewaysMovingAverage: function (bars, shortPeriod, longPeriod, threshold) {
        if (bars.length < longPeriod) return false;
      
        let shortSum = 0;
        let longSum = 0;
      
        // Initialize sums for short and long periods
        for (let i = 0; i < longPeriod; i++) {
          longSum += bars[i].ClosePrice;
          if (i < shortPeriod) {
            shortSum += bars[i].ClosePrice;
          }
        }
      
        // Calculate moving averages
        const shortMA = shortSum / shortPeriod;
        const longMA = longSum / longPeriod;
      
        // Check if the stock is moving sideways based on the moving averages
        return Math.abs(shortMA - longMA) < threshold;
      },

      isSidewaysBollingerBands: function (bars, period, multiplier, threshold) {
        if (bars.length < period) return false;
      
        let sum = 0;
        let sumOfSquares = 0;
      
        // Initialize sum and sum of squares for standard deviation calculation
        for (let i = 0; i < period; i++) {
          sum += bars[i].ClosePrice;
          sumOfSquares += bars[i].ClosePrice * bars[i].ClosePrice;
        }
      
        // Calculate mean and standard deviation
        const mean = sum / period;
        const variance = (sumOfSquares / period) - (mean * mean);
        const standardDeviation = Math.sqrt(variance);
      
        // Calculate upper and lower Bollinger Bands
        const upperBand = mean + (multiplier * standardDeviation);
        const lowerBand = mean - (multiplier * standardDeviation);
      
        // Check if the stock is moving sideways based on Bollinger Bands
        return Math.abs(upperBand - lowerBand) < threshold;
      }
}

module.exports=toolsKNN