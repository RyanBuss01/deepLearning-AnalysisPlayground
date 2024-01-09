const tf = require("@tensorflow/tfjs");
const l2 = tf.regularizers.l2({l2: 0.01});
const toolsLSTM = require("../tools/toolsLSTM");
const tools = require("../tools/tools");
const ta = require("../ta");

var lstm = {

    run: function (fullBars, tickerList, {seqLength=50, epochs=100, batchSize=50, printable}) {
        let dataSize = 4

        let bars0 = this.dataPrep(fullBars, tickerList)

        let minValues = toolsLSTM.bookEnd(fullBars, 'min');
        let maxValues = toolsLSTM.bookEnd(fullBars, 'max');
        let bars = []

        for(let i=50; i<fullBars.length; i++) {
            bars.push({
                ClosePrice: fullBars[i].ClosePrice,
                OpenPrice: fullBars[i].OpenPrice,
                HighPrice: fullBars[i].HighPrice,
                LowPrice: fullBars[i].LowPrice,
                Volume: fullBars[i].Volume,
            })
        }
        
        for (let i = 0; i < bars.length; i++) {
            bars[i].ClosePrice = toolsLSTM.normalize(bars[i].ClosePrice, minValues.ClosePrice, maxValues.ClosePrice);
            bars[i].HighPrice = toolsLSTM.normalize(bars[i].HighPrice, minValues.HighPrice, maxValues.HighPrice);
            bars[i].OpenPrice = toolsLSTM.normalize(bars[i].OpenPrice, minValues.OpenPrice, maxValues.OpenPrice);
            bars[i].LowPrice = toolsLSTM.normalize(bars[i].LowPrice, minValues.LowPrice, maxValues.LowPrice);
            bars[i].Volume = toolsLSTM.normalize(bars[i].Volume, minValues.Volume, maxValues.Volume)
        }
        
        // Creating model
        const model = this.creatModel()
        const { x, y } = this.preProccessing(bars, seqLength)
  
        let bestValLoss = Number.POSITIVE_INFINITY;
        let bestModel=null
        let patienceCounter=0
        let patience=3
        let bestModelEpoch=0

        const modelCheckpointCallback = {
        onEpochEnd: (epoch, logs) => {
            console.clear()
            if(printable) console.log(printable)
            if (logs.val_loss < bestValLoss) {
            patienceCounter=0
            bestValLoss = logs.val_loss;
            bestModel = rnn.cloneModel(model, seqLength)
            bestModelEpoch=epoch
            console.log(`Best model saved at epoch ${epoch} with validation loss: ${bestValLoss}`);
            }  else {
                patienceCounter++;
                console.log(`Epoch ${epoch} / ${epochs}: val_loss did not improve at ${logs.val_loss}, Current Best Epoch: ${bestModelEpoch} with loss: ${bestValLoss}`);
                if (patienceCounter >= patience && epoch>=10) {
                  model.stopTraining = true; 
                }
            }
        }
        }
        

        // Fitting the model
        model.fit(x, y, {
            batchSize: batchSize,
            epochs: epochs,
            validationSplit: 0.2,
            shuffle: true,
            callbacks:[modelCheckpointCallback],
        }).then((history)  => {
            process.stdout.write("\r\x1b[K")
            this.rnnResults({bars: bars, model:bestModel, seqLength:seqLength, epoch:bestModelEpoch, valMin: minValues.ClosePrice, valMax: maxValues.ClosePrice})
        });
    },

    rnnResults: async function ({bars,seqLength, model, epoch, valMin, valMax, callback}) {
        console.log("Run Results")
        let latestSequence = bars.slice(bars.length - seqLength).map(bar => [bar.ClosePrice, bar.HighPrice, bar.OpenPrice, bar.LowPrice]);
        let inputTensor = tf.tensor3d([latestSequence]);

        // console.log("result check: ", valMin, valMax)
        let prediction = model.predict(inputTensor).dataSync()[0];
        let actualPrediction = toolsLSTM.denormalize(prediction, valMin, valMax);
        console.log("prediction:", prediction, actualPrediction);
        callback(actualPrediction, epoch)
    },

    preProccessing: function (bars, seqLength) {
        let dataX = [], dataY = [];

        // Creating the data
        for(let i = 0; i < bars.length - seqLength; i++) {
            let sequence = bars.slice(i, i + seqLength).map(bar => [bar.ClosePrice, bar.HighPrice, bar.OpenPrice, bar.LowPrice]);
            dataX.push(sequence);
            let nextDayClose = bars[i + seqLength].ClosePrice;
            dataY.push(nextDayClose); // Adjusted to push a scalar value instead of an array
        }

        // The dataX should now be [num_samples, seq_length, num_features]
        const x = tf.tensor3d(dataX); // Reshape as a 3D tensor
        const y = tf.tensor2d(dataY, [dataY.length, 1]);

        return {x,y}
    },


    backTest: async function(fullBars, i=1, success=0, total=0, resList=[]) {

        let bars= JSON.parse(JSON.stringify(fullBars)).slice(0,-i);
        this.run(bars, (p, e)=>{
            let oldNum = fullBars[fullBars.length - (i+1)].ClosePrice, newNum = fullBars[fullBars.length - i].ClosePrice
            let rChange = tools.pDiff(oldNum, newNum)
            let pChange = tools.pDiff(newNum, p)
            let prediction = p
            total++
            if((pChange>0 && rChange>0) ||(pChange<0 && rChange<0)) success++

            resList.push({epoch:e, lastClose:Number(oldNum.toFixed(2)), prediction: Number(prediction.toFixed(2)), prediction_precentage: Number(pChange.toFixed(2)), actual: Number(newNum.toFixed(2)), actualPrecentage: Number(rChange.toFixed(2)), ts:fullBars[fullBars.length - i].Timestamp, success: `${success} / ${total}`, success_rate: (Number(((success/total)*100).toFixed(2)))})
            // console.clear()
            console.log(resList)
            i++
            if(i<100) {this.backTest(fullBars, i, success, total, resList)}
            else {return}
        }, {printable: resList})
    },

    creatModel: function () {
        const model = tf.sequential();

        model.add(tf.layers.lstm({units: 50, inputShape: [null, 4], kernelRegularizer: l2,  activation: 'tanh'})); // Set the second dimension of inputShape to the number of features (7 in this case)
        model.add(tf.layers.dropout(0.2));
        model.add(tf.layers.dense({units: 1}));
        
        // Compile the model
        model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae']
        });

        return model
    },

    cloneModel: function (model, seqLength) {
        // Create a new model with the same architecture
        const newModel = this.creatModel(seqLength)
      
        // Copy the weights from the old model to the new one
        newModel.setWeights(model.getWeights());
      
        return newModel;
      },

      dataPrep: function (fullBars, tickerList) {
        let bars = []

        // let vix = tickerList.filter(t=>t.ticker=='VXZ')[0].bars
        let uup = tickerList.filter(t=>t.ticker=='UUP')[0].bars
        let shy = tickerList.filter(t=>t.ticker=='SHY')[0].bars
        let xly = tickerList.filter(t=>t.ticker=='XLY')[0].bars

        console.log([fullBars.length, uup.length, shy.length, xly.length ])

        for(let i=50; i<fullBars.length; i++) {
            let barSet = fullBars.slice(0, i)
            bars.push({
                close: fullBars[i].ClosePrice,
                macd: ta.getMacd(barSet).histogram,
                rsi: ta.getRSI(barSet, 14),
                atr: ta.getATR(barSet, 14),
                
            })
        }

      }

}

module.exports=lstm