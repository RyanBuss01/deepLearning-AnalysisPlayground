const ta = require("../ta.js");
const tools = require("../tools/tools");
const toolsKNN = require("../tools/toolsKNN");

var cosineSim = {
    run: function (bars, {alertWinRate=false, findWinRate=false, backTest=false}) {
        let close = bars.map(b=>b.ClosePrice)
        let predictions = this.getPredictions(bars)
        let trend = this.sigmoid(close)

        // let avgPrediction = predictions.length > 0 ? predictions.reduce((a, b) => a + b, 0) / predictions.length : 0; 
        let sumPrediction = predictions.reduce((a, b) => a + b, 0);

        let isBuySignal = trend[trend.length-1] < close[close.length-1] 
        let {prob, maxProb} = this.getProbability(bars, isBuySignal)
        let alert = this.alert(bars, sumPrediction, isBuySignal, prob)
        let winRate, maxRate;
        if(((alert && alertWinRate) || findWinRate) ){ 
            // let rateRes = this.singleBacktest(bars, trend, 400)
            // winRate= rateRes.winRate
            // maxRate= rateRes.maxWinRate
        }

        return {
            prediction: sumPrediction,
            signal: isBuySignal ? "Bullish" : "Bearish",
            alert: alert,
            // winRate: winRate,
            // maxRate: maxRate,
            prob: prob,
            maxProb: maxProb
        }
    },

    singleBacktest: function (fullBars, fullTrend, period) {
        let success = 0, successMax=0, total = 0
        for (let i = 5; i < period; i++) { // Assuming you loop through your bars here
            let bars = fullBars.slice(0, -i)
            if(bars.length < 201) continue
            let trend = fullTrend.slice(0, -i)
            let close = bars.map(b=>b.ClosePrice)
            let predictions = this.getPredictions(bars)
            

            let sumPrediction = predictions.reduce((a, b) => a + b, 0);


            let isBuySignal = trend[trend.length-1] < close[close.length-1] 
            let alert = this.alert(bars, sumPrediction, isBuySignal)
            if(alert) {
                        total++
                        let isSuccessful = false
                        let isMaxSuccessful = false
                        for(let k=0; k < 5; k++) {
                            if(isBuySignal) {
                                if(!isSuccessful && fullBars[bars.length-1].ClosePrice < fullBars[bars.length+k].ClosePrice) {success++; isSuccessful=true}
                                if(!isMaxSuccessful && fullBars[bars.length-1].ClosePrice < fullBars[bars.length+k].HighPrice) {successMax++; isMaxSuccessful=true}
                            }
                            if(!isBuySignal) {
                                if(!isSuccessful && fullBars[bars.length-1].ClosePrice > fullBars[bars.length+k].ClosePrice) {success++; isSuccessful=true}
                                if(!isMaxSuccessful && fullBars[bars.length-1].ClosePrice > fullBars[bars.length+k].LowPrice) {successMax++; isMaxSuccessful=true}
                            }  
            }
        }
        }

        
    
        // Calculating and returning the win rate.
        let winRate = Number((100*(success / total)).toFixed(2));
        let maxWinRate =  Number((100*(successMax / total)).toFixed(2));
        return {winRate: winRate, maxWinRate: maxWinRate};
    },

    getPredictions: function (bars) {
        // General Settings
        const historyLookBack = 2000; // Number of historical periods to consider for analysis.
        const nearest_Probable_Distance = 8; // The closest distance to consider when determining probable values.

        // Moving Averages
        const cpmaLength = 9; // The length of the Centered Price Moving Average (CPMA) used for trend analysis.
        const frmaLength = 14; // The length of the Fractal Adaptive Moving Average (FRMA) used for trend analysis.

        // Machine Learning: Methods
        const methodSelection = 'Cosine similarity'; // The method used for calculating the distance similarity or dissimilarity when processing signals using machine learning techniques.

        // Backtesting

        let hlc3 = bars.map(bar => (bar.HighPrice + bar.LowPrice + bar.ClosePrice) / 3);
        let close = bars.map(b=>b.ClosePrice)
        let high = bars.map(b=> b.HighPrice)
        let low = bars.map(b=>b.LowPrice)


        // Assume CSM.CSM_CPMA and CSM.frama_Calculation are implemented
        let CPMA = this.cpma(bars, cpmaLength);
        let FRMA = this.framaCalculation(close, frmaLength);

        class FeatureArrays {
            constructor(f1, f2, f3, f4, f5, f6) {
                this.f1 = f1;
                this.f2 = f2;
                this.f3 = f3;
                this.f4 = f4;
                this.f5 = f5;
                this.f6 = f6;
            }
        }
        
        class FeatureSeries {
            constructor(f1, f2, f3, f4, f5, f6) {
                this.f1 = f1;
                this.f2 = f2;
                this.f3 = f3;
                this.f4 = f4;
                this.f5 = f5;
                this.f6 = f6;
            }
        }

        function series_from(feature_string, _close, _high, _low, _hlc3, f_paramA, f_paramB) {
            switch(feature_string) {
              case "RSI": return cosineSim.n_rsi(_close, f_paramA, f_paramB);
              case "KST": return cosineSim.get_Linear_interpolation(cosineSim.calc_kst(_close), 100);
              case "CPMA": return cosineSim.get_linear_transformation(CPMA, 14, 1);
              case "VWAP": return cosineSim.get_linear_transformation(cosineSim.getVWAP(bars), 14, 1); // Assuming vwap is implemented
              case "FRAMA": return cosineSim.get_linear_transformation(FRMA, 14, 1);
              case "MACD": return cosineSim.macd(_close);
              default: return null;
            }
          }

        let featureSeries = new FeatureSeries(
            series_from("CPMA", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f1
            series_from("RSI", close, high, low, hlc3, 14, 1).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f2
            series_from("VWAP", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f3
            series_from("KST", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f4
            series_from("FRAMA", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f5
            series_from("MACD", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0) // f6
        );
        
        let featureArrays = new FeatureArrays(
            featureSeries.f1.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f1Array
            featureSeries.f2.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f2Array
            featureSeries.f3.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f3Array
            featureSeries.f4.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f4Array
            featureSeries.f5.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f5Array
            featureSeries.f6.map(f=> (typeof f === 'number' && !isNaN(f)) ? f : 0)  //f6Array
        );


        let y_train_array = [];
        let src = close; // assuming close is an array representing 'src' from Pine-Script
        for(let i = 0; i < src.length - 4; i++) {
            y_train_array[i] = src[i + 4] < src[i] ? -1 : src[i + 4] > src[i] ? 1 : 0;
        }

        let distances = [], predictions = [], lastDistance = -Infinity;
        let size = Math.min(historyLookBack - 1, featureArrays.f1.length - 1); // or whatever feature is being used

        for (let i = 0; i <= size; i++) {
            const d = this.get_ML_Distance(i, featureSeries, featureArrays, methodSelection);

            if (d >= lastDistance && i % 4 === 0) { // changed to i % 4 === 0 to match the Pine-Script logic
                lastDistance = d;
                distances.push(d);
                predictions.push(y_train_array[i]); // assuming y_train_array is populated correctly
                
                if (predictions.length > nearest_Probable_Distance) {
                    lastDistance = distances[Math.round(nearest_Probable_Distance * 3 / 4)];
                    distances.shift();
                    predictions.shift();
                }
            }
        }


        return predictions
    },

    alert: function (bars, sumPrediction, isBuySignal, prob) {
        const filterVolatility = ta.volatilityBreak(bars.map(b=>b.HighPrice), bars.map(b=>b.LowPrice), bars.map(b=>b.ClosePrice), 1, 10);
        const filterVolume = ta.volumeBreak(bars.map(b=>b.Volume), 49);
        let emaFilter = toolsKNN.emaFilter(bars, isBuySignal ? "Bullish" : "Bearish")
        let sidewaysFilter = toolsKNN.filter(bars)
        let isTrending = (isBuySignal && sumPrediction>0) || (!isBuySignal && sumPrediction<0)
        let isProbabable 
        // if(prob) isProbabable = (prob>60)

        const filter =  (filterVolatility && filterVolume && emaFilter && !sidewaysFilter && isTrending)

        return filter
    },

    runLegacy: function (bars) {
        // General Settings
        const historyLookBack = 2000; // Number of historical periods to consider for analysis.
        const nearest_Probable_Distance = 8; // The closest distance to consider when determining probable values.

        // Moving Averages
        const trenSelection = 'RationalQuad'; // The type of moving average to use for trend analysis.
        const cpmaLength = 9; // The length of the Centered Price Moving Average (CPMA) used for trend analysis.
        const frmaLength = 14; // The length of the Fractal Adaptive Moving Average (FRMA) used for trend analysis.

        // Machine Learning: Methods
        const methodSelection = 'Cosine similarity'; // The method used for calculating the distance similarity or dissimilarity when processing signals using machine learning techniques.

        // Backtesting

        let hlc3 = bars.map(bar => (bar.HighPrice + bar.LowPrice + bar.ClosePrice) / 3);
        let close = bars.map(b=>b.ClosePrice)
        let high = bars.map(b=> b.HighPrice)
        let low = bars.map(b=>b.LowPrice)


        // Assume CSM.CSM_CPMA and CSM.frama_Calculation are implemented
        let CPMA = this.cpma(bars, cpmaLength);
        let FRMA = this.framaCalculation(close, frmaLength);

        class FeatureArrays {
            constructor(f1, f2, f3, f4, f5, f6) {
                this.f1 = f1;
                this.f2 = f2;
                this.f3 = f3;
                this.f4 = f4;
                this.f5 = f5;
                this.f6 = f6;
            }
        }
        
        class FeatureSeries {
            constructor(f1, f2, f3, f4, f5, f6) {
                this.f1 = f1;
                this.f2 = f2;
                this.f3 = f3;
                this.f4 = f4;
                this.f5 = f5;
                this.f6 = f6;
            }
        }

        function series_from(feature_string, _close, _high, _low, _hlc3, f_paramA, f_paramB) {
            switch(feature_string) {
              case "RSI": return cosineSim.n_rsi(_close, f_paramA, f_paramB);
              case "KST": return cosineSim.get_Linear_interpolation(cosineSim.calc_kst(_close), 100);
              case "CPMA": return cosineSim.get_linear_transformation(CPMA, 14, 1);
              case "VWAP": return cosineSim.get_linear_transformation(cosineSim.getVWAP(bars), 14, 1); // Assuming vwap is implemented
              case "FRAMA": return cosineSim.get_linear_transformation(FRMA, 14, 1);
              case "MACD": return cosineSim.macd(_close);
              default: return null;
            }
          }

        let featureSeries = new FeatureSeries(
            series_from("CPMA", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f1
            series_from("RSI", close, high, low, hlc3, 14, 1).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f2
            series_from("VWAP", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f3
            series_from("KST", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f4
            series_from("FRAMA", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), // f5
            series_from("MACD", close, high, low, hlc3, 0, 0).map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0) // f6
        );
        
        let featureArrays = new FeatureArrays(
            featureSeries.f1.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f1Array
            featureSeries.f2.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f2Array
            featureSeries.f3.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f3Array
            featureSeries.f4.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f4Array
            featureSeries.f5.map(f => (typeof f === 'number' && !isNaN(f)) ? f : 0), //f5Array
            featureSeries.f6.map(f=> (typeof f === 'number' && !isNaN(f)) ? f : 0)  //f6Array
        );


        let y_train_array = [];
        let src = close; // assuming close is an array representing 'src' from Pine-Script
        for(let i = 0; i < src.length - 4; i++) {
            y_train_array[i] = src[i + 4] < src[i] ? -1 : src[i + 4] > src[i] ? 1 : 0;
        }

        let distances = [], predictions = [], lastDistance = -Infinity;
        let size = Math.min(historyLookBack - 1, featureArrays.f1.length - 1); // or whatever feature is being used

        for (let i = 0; i <= size; i++) {
            const d = this.get_ML_Distance(i, featureSeries, featureArrays, methodSelection);

            if (d >= lastDistance && i % 4 === 0) { // changed to i % 4 === 0 to match the Pine-Script logic
                lastDistance = d;
                distances.push(d);
                predictions.push(y_train_array[i]); // assuming y_train_array is populated correctly
                
                if (predictions.length > nearest_Probable_Distance) {
                    lastDistance = distances[Math.round(nearest_Probable_Distance * 3 / 4)];
                    distances.shift();
                    predictions.shift();
                }
            }
        }

        let avgPrediction = predictions.length > 0 ? predictions.reduce((a, b) => a + b, 0) / predictions.length : 0; 
        let sumPrediction = predictions.reduce((a, b) => a + b, 0);

        let trend = this.sigmoid(close)

        if(isNaN(sumPrediction)){
            console.error('Prediction is NaN', {
                // featureArrays,
                // featureSeries,
                // f6: featureSeries.f6,
                y_train_array,
                distances,
                predictions,
                lastDistance,
                size,
            });
        }


        function getLastSignal() {
            for(let i=2; i<Math.min(close.length, trend.length); i++) {
                if(sumPrediction >= 0 && close[close.length - i] >= trend[trend.length - i]) return 1;
                if(sumPrediction < 0 && close[close.length - i] <= trend[trend.length - i]) return -1;
            }
            return 0; // Default to 0 if no condition is met
        }

       function getSignal() {
            if(sumPrediction >= 0) {
                if(close[close.length - 1] >= trend[trend.length - 1] && close[close.length - 2] < trend[trend.length - 2]) return 1
            } else {
                if(close[close.length - 1] <= trend[trend.length - 1] && close[close.length - 2] > trend[trend.length - 2]) return -1
        }
        return 0
        }
        
        let signal = getSignal();
        let lastSignal = getLastSignal();
        
        // if(sumPrediction >= 0) {
        //     signal = close[close.length - 1] >= trend[trend.length - 1] ? 1 : lastSignal;
        // } else {
        //     signal = close[close.length - 1] <= trend[trend.length - 1] ? -1 : lastSignal;
        // }
        
        // let isDifferentSignalType = (signal !== lastSignal && signal!=0);
        
        // if(sumPrediction>0) {
        //     if(close[close.length-2] < trend[trend.length-2]) isDifferentSignalType=true
        // } else {
        //     if(close[close.length-2] < trend[trend.length-2]) isDifferentSignalType=true
        // }


        

        const filterVolatility = ta.volatilityBreak(bars.map(b=>b.HighPrice), bars.map(b=>b.LowPrice), bars.map(b=>b.ClosePrice), 1, 10);
        const filterVolume = ta.volumeBreak(bars.map(b=>b.Volume), 49);
      
        const filter =  (filterVolatility && filterVolume)


        // console.log("prediction:", sumPrediction, predictions.length, trend[trend.length-1], close[close.length-1],  signal)
        let isBuySignal = trend[trend.length-1] < close[close.length-1] 
        let trendSignal = isBuySignal ? "Bullish" : "Bearish"
        let isTrending = (isBuySignal && sumPrediction>0) || (!isBuySignal && sumPrediction<0)

        return {
            prediction: sumPrediction,
            signal: trendSignal,
            alert: filter,
            isTrending: isTrending
        }
    },

    run0: function (bars) {
        // General Settings
        const historyLookBack = 2000; // Number of historical periods to consider for analysis.
        const nearest_Probable_Distance = 8; // The closest distance to consider when determining probable values.

        // Moving Averages
        const trenSelection = 'RationalQuad'; // The type of moving average to use for trend analysis.
        const cpmaLength = 9; // The length of the Centered Price Moving Average (CPMA) used for trend analysis.
        const frmaLength = 14; // The length of the Fractal Adaptive Moving Average (FRMA) used for trend analysis.

        // Filter
        const enableFilter = true; // Enable or disable the trend filter for signal processing, which provides greater accuracy.
        const isRational = true; // Enable or disable the rational smoothing function for the selected moving average, used as a trend filter.
        const isRationalSigma = true; // Enable or disable the sigmoid smoothing function, which works in conjunction with the rational smoothing function.

        // Machine Learning: Methods
        const methodSelection = 'Cosine similarity'; // The method used for calculating the distance similarity or dissimilarity when processing signals using machine learning techniques.

        // Backtesting
        const start = new Date('2023-01-01T03:30:00Z'); // The date and time to begin trading from during the backtesting period.
        const finish = new Date('2099-01-01T15:30:00Z'); // The date and time to stop trading during the backtesting period.

        let hlc3 = bars.map(bar => (bar.HighPrice + bar.LowPrice + bar.ClosePrice) / 3);
        let close = bars.map(b=>b.ClosePrice)
        let high = bars.map(b=> b.HighPrice)
        let low = bars.map(b=>b.LowPrice)


        // Assume CSM.CSM_CPMA and CSM.frama_Calculation are implemented
let CPMA = this.cpma(bars, cpmaLength);
let FRMA = this.framaCalculation(close, frmaLength);

// Define FeatureArrays and FeatureSeries as classes
class FeatureArrays {
  constructor(f1, f2, f3, f4, f5, f6) {
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.f4 = f4;
    this.f5 = f5;
    this.f6 = f6;
  }
}

class FeatureSeries {
  constructor(f1, f2, f3, f4, f5, f6) {
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.f4 = f4;
    this.f5 = f5;
    this.f6 = f6;
  }
}

// Implement series_from function
function series_from(feature_string, _close, _high, _low, _hlc3, f_paramA, f_paramB) {
  switch(feature_string) {
    case "RSI": return cosineSim.n_rsi(_close, f_paramA, f_paramB);
    case "KST": return cosineSim.get_Linear_interpolation(cosineSim.calc_kst(_close), 100);
    case "CPMA": return cosineSim.get_linear_transformation(CPMA, 14, 1);
    case "VWAP": return cosineSim.get_linear_transformation(cosineSim.getVWAP(bars), 14, 1); // Assuming vwap is implemented
    case "FRAMA": return cosineSim.get_linear_transformation(FRMA, 14, 1);
    case "MACD": return cosineSim.macd(_close);
    default: return null;
  }
}


// Generate a FeatureSeries object
let featureSeries = new FeatureSeries(
  series_from("CPMA", close, high, low, hlc3, 0, 0),
  series_from("RSI", close, high, low, hlc3, 14, 1),
  series_from("VWAP", close, high, low, hlc3, 0, 0),
  series_from("KST", close, high, low, hlc3, 0, 0),
  series_from("FRAMA", close, high, low, hlc3, 0, 0),
  series_from("MACD", close, high, low, hlc3, 0, 0)
);

// Initialize feature arrays
let f1Array = [];
let f2Array = [];
let f3Array = [];
let f4Array = [];
let f5Array = [];
let f6Array = [];

// Push to feature arrays
f1Array.push(featureSeries.f1);
f2Array.push(featureSeries.f2);
f3Array.push(featureSeries.f3);
f4Array.push(featureSeries.f4);
f5Array.push(featureSeries.f5);
f6Array.push(featureSeries.f6);

// Create a FeatureArrays object
let featureArrays = new FeatureArrays(f1Array, f2Array, f3Array, f4Array, f5Array, f6Array);

let rqkValue = isRationalSigma ? this.sigmoid(close) : this.rationalQuadratic(close, 8, 0.5, 25)

let maxBarsBackIndex = bars.length-1 >= historyLookBack ? bars.length-1 - historyLookBack : 0

let src = close;  // Assuming 'close' is already defined as an array of close prices
let y_train_series = src[src.length-5] < src[src.length-1] ? -1 : src[src.length-5] > src[src.length-1] ? 1 : 0;

let y_train_array = [];  // Create an empty array to store integers

// Variables used for ML Logic
let predictions = [];  // Create an empty array to store floats
let prediction = 0.0;
let signal = 0;
let distances = [];  // Create an empty array to store floats

// Push the y_train_series value into the y_train_array
y_train_array.push(y_train_series);

let lastDistance = -1.0;
let size = Math.min(historyLookBack - 1, y_train_array.length - 1);  // Assuming 'historyLookBack' is already defined
let sizeLoop = Math.min(historyLookBack - 1, size);

    for (let i = 0; i <= sizeLoop; i++) {
        const d = this.get_ML_Distance(i, featureSeries, featureArrays, methodSelection);  // Assuming that you've defined get_ML_Distance previously
        if (d >= lastDistance && i % 4) {
            lastDistance = d;

            // Push distance and prediction to arrays
            distances.push(d);
            predictions.push(Math.round(y_train_array[i]));

            // Check the size of the predictions array
            if (predictions.length > nearest_Probable_Distance) {
                
                // Update lastDistance to the distance at the index (nearest_Probable_Distance * 3 / 4)
                lastDistance = distances[Math.round(nearest_Probable_Distance * 3 / 4)];

                // Remove the oldest distance and prediction from the arrays
                distances.shift();
                predictions.shift();
            }
        }
    }

    // Calculate the final prediction
    prediction = predictions.reduce((a, b) => a + b, 0);

    let trend = this.getTrend(trenSelection, CPMA, FRMA, rqkValue, isRational, isRationalSigma) 

    // Determine if the current price is bullish or bearish relative to the trend.
let isBullishSmooth = close[close.length-1] >= trend[trend.length-1];
let isBearishSmooth = close[close.length-1] <= trend[trend.length-1];


console.log( prediction, predictions)

    },

    getProbability: function (bars, isBuySignal) {

        function determineTrend (ema, close) {
            if (ema._50 > close && ema._100 > close) return "Bearish";
            if (ema._50 < close && ema._100 < close) return "Bullish";
            return 'None';
        }

        let reachedTarget = 0, total = 0, reachedMaxTarget=0;
        let period = 5;
        let diff = isBuySignal ? 1 : -1; // Adjust as per your requirement
    
        for (let i = 100; i < bars.length - period; i++) {
            const subBars = bars.slice(0, i);
            const subClose = subBars[subBars.length - 1].ClosePrice;
            
            const ema = {
                _50: ta.getEMA(subBars.map(b => b.ClosePrice), 50),
                _100: ta.getEMA(subBars.map(b => b.ClosePrice), 100)
            };
    
            const trend = determineTrend(ema, subClose);
            const subset = bars.slice(i, i + period);
            const priceInPeriod = isBuySignal ? 
                Math.max(...subset.map(bar => bar.ClosePrice)) : 
                Math.min(...subset.map(bar => bar.ClosePrice));
            
            const maxPriceInPeriod = isBuySignal ? 
                Math.max(...subset.map(bar => bar.HighPrice)) : 
                Math.min(...subset.map(bar => bar.LowPrice));
                
            const subDiff = tools.pDiff(subset[0].ClosePrice, priceInPeriod);
            const subMaxDiff = tools.pDiff(subset[0].ClosePrice, maxPriceInPeriod);
            
            if(isBuySignal && trend === 'Bullish') {
                total++;
                if (subDiff > diff) reachedTarget++;
                if(subMaxDiff > diff) reachedMaxTarget++
            }
            else if(!isBuySignal && trend === 'Bearish') {
                total++;
                if (subDiff < diff) reachedTarget++;
                if (subMaxDiff < diff) reachedMaxTarget++
                
            } 

        }
        
        const prob = total === 0 ? 0 : Number(((reachedTarget / total) * 100).toFixed(3));
        const maxProb = total === 0 ? 0 : Number(((reachedMaxTarget / total) * 100).toFixed(3));
        return {prob, maxProb};
    },

    rationalQuadratic: function (_src, _lookback, _relativeWeight, startAtBar) {
        let _currentWeight = 0.0; // Initialize the current weight variable
        let _cumulativeWeight = 0.0; // Initialize the cumulative weight variable
        let _size = _src.length; // Get the size of the input series
    
        for (let i = 0; i < _size + startAtBar; i++) {
            let y = _src[i]; // Get the value at index i
            if (y === undefined) continue; // Skip undefined values (out-of-bound indices)
    
            // Calculate the weight using the rational quadratic formula
            let w = Math.pow(1 + (Math.pow(i, 2) / (Math.pow(_lookback, 2) * 2 * _relativeWeight)), -_relativeWeight);
    
            _currentWeight += y * w; // Add the weighted value to the current weight
            _cumulativeWeight += w; // Add the weight to the cumulative weight
        }
    
        let rationalQuad = _currentWeight / _cumulativeWeight; // Calculate the rational quadratic value
        return rationalQuad;
    },

    lowest: function (array, lookback) {
        const startIdx = Math.max(0, array.length - lookback);
        const slicedArray = array.slice(startIdx);
        return Math.min(...slicedArray);
    },
    
    // Function to perform linear interpolation
    get_Linear_interpolation: function (src, oldMax, lookback = 100) {
        const interpolatedArray = src.map((value, index, array) => {
            const minVal = this.lowest(array.slice(0, index + 1), lookback); // you might want to adjust the slice params if needed
            return (value - minVal) / (oldMax - minVal);
        });
        return interpolatedArray;
    },

    n_rsi: function (src, n1, n2) {
        const rsiValues = this.getRSIArray(src, n1);
        const emaValues = this.getEMAArray(rsiValues, n2);
        const interpol = this.get_Linear_interpolation(emaValues, 100);
        return interpol
    },

    getRSIArray: function (src, period = 14) {
        let gains = [];
        let losses = [];
        let rsiValues = [];
    
        for(let i = 1; i < src.length; i++) {
            let change = src[i] - src[i - 1];
    
            gains.push(Math.max(0, change));
            losses.push(Math.max(0, -change));
        }
    
        let avgGain = 0;
        let avgLoss = 0;
    
        for(let i = 0; i < period; i++) {
            avgGain += gains[i];
            avgLoss += losses[i];
        }
    
        avgGain /= period;
        avgLoss /= period;
    
        if(avgLoss === 0) {
            rsiValues.push(100); // avgLoss is 0 means avgGain is greater than avgLoss, hence RSI is 100.
        } else {
            rsiValues.push(100 - (100 / (1 + (avgGain / avgLoss))));
        }
    
        for(let i = period; i < gains.length; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
            
            if(avgLoss === 0) {
                rsiValues.push(100); // avgLoss is 0 means avgGain is greater than avgLoss, hence RSI is 100.
            } else {
                rsiValues.push(100 - (100 / (1 + (avgGain / avgLoss))));
            }
        }
    
        // Debugging Logs
        // console.log("Avg Gain:", avgGain, "Avg Loss:", avgLoss, "RSI Values:", rsiValues, "SRC:", src);
    
        return rsiValues;
    },

    calc_kst: function (src) {
        const lengthROC1 = 10, lengthROC2 = 15, lengthROC3 = 20, lengthROC4 = 30;
      
        let roc1 = this.getROCArray(src, lengthROC1);
        let roc2 = this.getROCArray(src, lengthROC2);
        let roc3 = this.getROCArray(src, lengthROC3);
        let roc4 = this.getROCArray(src, lengthROC4);
      
        let smoothed1 = this.getSMAArray(roc1, 3).map(s=> isNaN(s)? 0 : s);
        let smoothed2 = this.getSMAArray(roc2, 3).map(s=> isNaN(s)? 0 : s);
        let smoothed3 = this.getSMAArray(roc3, 3).map(s=> isNaN(s)? 0 : s);
        let smoothed4 = this.getSMAArray(roc4, 3).map(s=> isNaN(s)? 0 : s);
      
        let kstLine = [];
        for(let i = 0; i < smoothed1.length; i++) {
          kstLine.push(smoothed1[i] + 2 * smoothed2[i] + 3 * smoothed3[i] + 4 * smoothed4[i]);
        }
      
        let rsiKST = this.getRSIArray(kstLine, 14);
        return rsiKST;
    },

    get_linear_transformation: function (src, min, max, lookback = 200) {

        // Find the highest value in an array within a lookback window
        function highest(array, lookback) {
            const startIdx = Math.max(0, array.length - lookback);
            const slicedArray = array.slice(startIdx);
            return Math.max(...slicedArray.filter(Boolean));
        }
        
        // Find the lowest value in an array within a lookback window
        function lowest(array, lookback) {
            const startIdx = Math.max(0, array.length - lookback);
            const slicedArray = array.slice(startIdx);
            return Math.min(...slicedArray.filter(Boolean));
        }

        // Handle null values in the src array (substitute nulls with zeros)
        const nonNullSrc = src.map(x => x !== null && x !== undefined ? x : 0);
      
        // Calculate the historical minimum and maximum values within the lookback period
        const _historicMin = highest(nonNullSrc, lookback);
        const _historicMax = lowest(nonNullSrc, lookback);
      
        // Perform the linear transformation calculation using the formula
        const linearValue = src.map(x => min + (max - min) * (x - _historicMin) / Math.max(_historicMax - _historicMin, 1e-10));
      
        // Return the transformed series
        return linearValue;
    },

    macd: function (array, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
        let shortEma = this.getEMAArray(array, shortPeriod);
        let longEma = this.getEMAArray(array, longPeriod);
        let macdLine = shortEma.map((val, idx) => val - longEma[idx]);
        
        // Assuming get_linear_transformation is implemented
        let ma = this.get_linear_transformation(macdLine, 14, 1); 
        const signalLine = this.getEMAArray(macdLine, signalPeriod, true);
        let sa = this.get_linear_transformation(signalLine, 14, 1); 
        
        let macd_val = ma.map((val, idx) => (val + sa[idx]) / 2);
        return macd_val;
    },

    macd_function:  function (src = []) {
        const [macdLine, signalLine] = this.macd(src);
        const ma = this.get_linear_transformation(macdLine, 14, 1);
        const sa = this.get_linear_transformation(signalLine, 14, 1);
        const macd_val = ma.map((val, idx) => (val + sa[idx]) / 2);
        return macd_val;
    },

    cpma: function (bars, length) {
        // Extract price data
        const high = bars.map(bar => bar.HighPrice);
        const low = bars.map(bar => bar.LowPrice);
        const close = bars.map(bar => bar.ClosePrice);
        const open = bars.map(bar => bar.OpenPrice);
    
        // Calculate derived price types
        const hl2 = high.map((val, idx) => (val + low[idx]) / 2);
        const hlc3 = high.map((val, idx) => (val + low[idx] + close[idx]) / 3);
        const hlcc4 = high.map((val, idx) => (val + low[idx] + close[idx] + close[idx]) / 4);
        const ohlc4 = high.map((val, idx) => (val + low[idx] + close[idx] + open[idx]) / 4);
    
        // Calculate the averages for each price type
        const Open_avg = this.getEMAArray(open, length);
        const price_avg = this.getEMAArray(close, length);
        const High_avg = this.getSMAArray(high, length);
        const Low_avg = this.getEMAArray(low, length);
        const HL2_avg = this.getSMAArray(hl2, length);
        const OHLC4_avg = this.getSMAArray(ohlc4, length);
        const HLC3_avg = this.getEMAArray(hlc3, length);
        const HLCC4_avg = this.getSMAArray(hlcc4, length);
    
        // Calculate the overall average of price types
        let price_average = [];
        for(let i = 0; i < Open_avg.length; i++) {
            price_average[i] = (price_avg[i] + HL2_avg[i] + Open_avg[i] + High_avg[i] + Low_avg[i] + OHLC4_avg[i] + HLC3_avg[i] + HLCC4_avg[i]) / 8;
        }
    
        // Calculate CPMA values
        let cpmaValues = [];
        for(let i = 1; i < price_average.length; i++) {
            if (isNaN(price_average[i - 1])) {
                cpmaValues[i] = price_average[i];
            } else {
                cpmaValues[i] = price_average[i - 1] + (close[i] - price_average[i - 1]) / (length * Math.pow(close[i] / price_average[i - 1], 4));
            }
        }
    
        return cpmaValues;
    },

    fractalDimension: function (array, n) {

        // Calculate the highest value in an array
        function highest(array, start, end) {
            return Math.max(...array.slice(start, end));
          }
          
          // Calculate the lowest value in an array
          function lowest(array, start, end) {
            return Math.min(...array.slice(start, end));
          }

        const dim = [];
        for (let i = n - 1; i < array.length; i++) {
          const high = highest(array, i - n + 1, i + 1);
          const low = lowest(array, i - n + 1, i + 1);
          const N = high - low;
          
          let D = 0;
          for (let j = i - n + 1; j < i; j++) {
            D += Math.abs(array[j + 1] - array[j]);
          }
          
          const dimValue = Math.log10(N / D) / Math.log10(2);
          dim.push(dimValue);
        }
        
        return dim;
    },
      
      // Calculate FRAMA
      framaCalculation: function(srcArray, length = 21, mult = 1.0) {
        let alpha = 2 / (length + 1);
        let framaArray = [];
    
        for (let idx = 0; idx < srcArray.length; idx++) {
            let sumWt = 0.0;
            let sumWtSrc = 0.0;
            
            if (idx - length + 1 < 0) {
                // If there's not enough data for a full window, push NaN or some placeholder value
                framaArray.push(NaN);
                continue;
            }
    
            for (let i = 0; i < length; i++) {
                let weight = Math.exp(Math.log(mult) * i * i / (length * length));
                sumWt += weight;
                sumWtSrc += weight * srcArray[idx - length + 1 + i];
            }
    
            framaArray.push(sumWtSrc / sumWt);
        }
    
        return framaArray;
    },

    sigmoid: function (src, lookback = 20, relativeWeight = 8, startAtBar = 25) {
        let sigmoidArray = new Array(src.length).fill(0); // Initialize the array
        
        let startIdx = src.length - 1;
        let endIdx = src.length - (startAtBar + lookback);
        
        for(let idx = startIdx; idx >= endIdx; idx--) {
            let currentWeight = 0.0;
            let cumulativeWeight = 0.0;
            
            let loopStart = Math.max(endIdx, idx - lookback);
            
            for(let i = loopStart; i <= idx; i++) {
                let y = src[i];
                if(y === undefined) continue; // Skip undefined values
                
                let relativeIdx = idx - i;
                let w = Math.pow(1 + (Math.pow(relativeIdx, 2) / (Math.pow(lookback, 2) * 2 * relativeWeight)), -relativeWeight);
                
                currentWeight += y * w;
                cumulativeWeight += w;
            }
            
            if(cumulativeWeight !== 0.0) 
                sigmoidArray[idx] = currentWeight / cumulativeWeight;
        }
        
        return sigmoidArray;
    },
    
    getEuclideanDistance: function (i, featureSeries, featureArrays, timeframePeriod) {
        let distance = 0.0;
      
        // Adding the squared differences for each feature
        distance += Math.pow(featureSeries.f1 - featureArrays.f1[i], 2);
        distance += Math.pow(featureSeries.f2 - featureArrays.f2[i], 2);
        distance += Math.pow(featureSeries.f4 - featureArrays.f4[i], 2);
        distance += Math.pow(featureSeries.f5 - featureArrays.f5[i], 2);
        distance += Math.pow(featureSeries.f6 - featureArrays.f6[i], 2);
      
        // Special condition based on the timeframe period
        if (parseInt(timeframePeriod, 10) <= 20) {
          distance += Math.pow(featureSeries.f3 - featureArrays.f3[i], 2);
        }
      
        // Return the square root of the sum of squared differences
        return Math.sqrt(distance);
      },

      getLorentzianDistance: function (i, featureSeries, featureArrays, timeframePeriod) {
        let distance = 0.0;
      
        // Adding the log of one plus the absolute differences for each feature
        distance += Math.log(1 + Math.abs(featureSeries.f1 - featureArrays.f1[i]));
        distance += Math.log(1 + Math.abs(featureSeries.f2 - featureArrays.f2[i]));
        distance += Math.log(1 + Math.abs(featureSeries.f4 - featureArrays.f4[i]));
        distance += Math.log(1 + Math.abs(featureSeries.f5 - featureArrays.f5[i]));
        distance += Math.log(1 + Math.abs(featureSeries.f6 - featureArrays.f6[i]));
      
        // Special condition based on the timeframe period
        if (parseInt(timeframePeriod, 10) <= 20) {
          distance += Math.log(1 + Math.abs(featureSeries.f3 - featureArrays.f3[i]));
        }
      
        // Return the square root of the sum of logs of one plus the absolute differences
        return Math.sqrt(distance);
      },

      getCosineSimilarity: function (i, featureSeries, featureArrays, timeframePeriod=1440) {
        let dotProduct = 0.0;
        let magnitudeSeries = 0.0;
        let magnitudeArray = 0.0;
      
        // Calculate dot product and magnitudes for each feature except f3
        dotProduct += featureSeries.f1[i] * featureArrays.f1[i];
        dotProduct += featureSeries.f2[i] * featureArrays.f2[i];
        dotProduct += featureSeries.f4[i] * featureArrays.f4[i];
        dotProduct += featureSeries.f5[i] * featureArrays.f5[i];
        dotProduct += featureSeries.f6[i] * featureArrays.f6[i];
      
        magnitudeSeries += Math.pow(featureSeries.f1[i], 2);
        magnitudeSeries += Math.pow(featureSeries.f2[i], 2);
        magnitudeSeries += Math.pow(featureSeries.f4[i], 2);
        magnitudeSeries += Math.pow(featureSeries.f5[i], 2);
        magnitudeSeries += Math.pow(featureSeries.f6[i], 2);
      
        magnitudeArray += Math.pow(featureArrays.f1[i], 2);
        magnitudeArray += Math.pow(featureArrays.f2[i], 2);
        magnitudeArray += Math.pow(featureArrays.f4[i], 2);
        magnitudeArray += Math.pow(featureArrays.f5[i], 2);
        magnitudeArray += Math.pow(featureArrays.f6[i], 2);


      
        // Special condition based on the timeframe period
        if (parseInt(timeframePeriod, 10) <= 20) {
          dotProduct += featureSeries.f3 * featureArrays.f3[i];
          magnitudeSeries += Math.pow(featureSeries.f3, 2);
          magnitudeArray += Math.pow(featureArrays.f3[i], 2);
        }
      
        // Calculate the square root of the magnitudes
        magnitudeSeries = Math.sqrt(magnitudeSeries);
        magnitudeArray = Math.sqrt(magnitudeArray);


        // Return cosine similarity
        if (magnitudeSeries === 0.0 || magnitudeArray === 0.0) {
          return 0.0;
        } else {
          return dotProduct / (magnitudeSeries * magnitudeArray);
        }
      },

      get_ML_Distance: function (i, featureSeries, featureArrays, methodSelection) {
        switch (methodSelection) {
          case 'Lorentzian':
            return this.getLorentzianDistance(i, featureSeries, featureArrays);
          case 'Euclidean':
            return this.getEuclideanDistance(i, featureSeries, featureArrays);
          case 'Cosine similarity':
            return this.getCosineSimilarity(i, featureSeries, featureArrays);
          default:
            return null; // Or throw an error
        }
      },

      getTrend: function (trenSelection, CPMA, FRMA, rqkValue, isRational, isRationalSigma) {
        let trendArray = [];
    
        for (let i = 0; i < CPMA.length; i++) {
            let currentTrend;
            switch (trenSelection) {
                case 'CPMA':
                    currentTrend = isRational ? 
                                    (isRationalSigma ? 
                                        this.sigmoid(CPMA[i]) : 
                                        this.rationalQuadratic(CPMA[i], 8, 0.5, 25)) : 
                                    CPMA[i];
                    break;
                case 'FRMA':
                    currentTrend = isRational ? 
                                    (isRationalSigma ? 
                                        this.sigmoid(FRMA[i]) : 
                                        this.rationalQuadratic(FRMA[i], 8, 0.5, 25)) : 
                                    FRMA[i];
                    break;
                case 'RationalQuad':
                    currentTrend = rqkValue[i];
                    break;
                default:
                    currentTrend = null;
            }
            trendArray.push(currentTrend);
        }
    
        return trendArray;
    },

    getGradientCalculator: function (srcArray, length = 50, beta = 0.5, isSmoothed = true) {
        let b = [];
        let outputArray = [];
        
        // Initialize b values once.
        for (let i = 0; i < length; i++) {
            const x = i / (length - 1);
            const w = Math.atan(2 * Math.PI * (1 - Math.pow(x, beta))) + Math.sin(2 * Math.PI * (1 - Math.pow(x, beta))) / 2;
            b.push(w);
        }
        
        // We can start the loop at index 'length' because we need at least 'length' elements in 'srcArray' 
        // to compute our weighted average. 
        for (let i = length; i < srcArray.length; i++) {
            let srcSum = 0;
            for (let j = 0; j < length; j++) {
                srcSum += srcArray[i - j] * b[j];
            }
            
            const bSum = b.reduce((acc, val) => acc + val, 0);
            srcSum /= bSum;
            
            // Push the value to the output array.
            outputArray.push(isSmoothed ? srcSum : srcArray[i]);
        }
        
        return outputArray;
    },

      getEMAArray: function (data, period, print=false) {
        let ema = [];
        let multiplier = 2 / (period + 1);
    
        // Start with a simple moving average for the first data point
        let sma = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
        ema[period - 1] = sma;
        
        // Calculate the EMA for the rest of the data
        for (let i = period; i < data.length; i++) {
            ema[i] = ((data[i] - ema[i - 1]) * multiplier) + ema[i - 1];
            if(isNaN(ema[i])) ema[i]=0
        }

    
        return ema;
    },

    getSMAArray: function (data, period) {
        let sma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                // Not enough data points to calculate SMA
                sma.push(NaN);
            } else {
                // Sum up the last 'period' data points and divide by 'period'
                let sum = 0;
                for (let j = i; j > i - period; j--) {
                    sum += data[j];
                }
                sma.push(sum / period);
            }
        }
        return sma;
    },

    getVWAP: function (bars) {
        let cumVol = 0;            // Cumulative Volume
        let cumVolPrice = 0;       // Cumulative Volume * Price
        let vwapValues = [];       // Array to store VWAP values
    
        for(let i = 0; i < bars.length; i++) {
            let bar = bars[i];
            cumVol += bar.Volume;
            cumVolPrice += bar.ClosePrice * bar.Volume;
            
            if(cumVol !== 0) {
                vwapValues.push(cumVolPrice / cumVol);
            } else {
                vwapValues.push(0);
            }
        }
    
        return vwapValues;
    },

    getROCArray: function (src, n) {
        if (!src || src.length === 0 || n <= 0) return [];
    
        let rocValues = new Array(n).fill(null); // Fill the first n spots with null since we can't compute ROC for them
    
        for (let i = n; i < src.length; i++) {
            let previousPrice = src[i - n];
            
            if (previousPrice !== 0) {
                rocValues[i] = ((src[i] - previousPrice) / previousPrice) * 100;
            } else {
                rocValues[i] = 0;
            }
        }
    
        return rocValues;
    }
      

    
};

function findAlerts (tickerList) {
    let resList=[]
    for(let i=0; i<tickerList.length; i++) {
        let bars = tickerList[i].bars
        if(bars.length>200 && !resList.includes(r => r.t == tickerList[i].ticker)) {
            let res = cosineSim.run(bars, {alertWinRate: true})
        if(res.alert) {
            resList.push({
                t: tickerList[i].ticker, // ticker
                s: res.signal, // signal
                // r: [res.winRate, res.maxRate], // rate
                p: [res.prob, res.maxProb], // probability
            })
        }
        process.stdout.write("\r\x1b[K")
        process.stdout.write(`iteration : ${i} / ${tickerList.length}`)
    }}
    process.stdout.write("\r\x1b[K")

    resList.sort((a) =>a.s=="Bullish" ? 1 : -1)

    for(let r of resList) console.log(r)
}

module.exports=findAlerts