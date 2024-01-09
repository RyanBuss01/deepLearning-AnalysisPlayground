const moment = require("moment");
const alpaca = require("../middleware/alpaca");
const blacklist = require("../constants/blacklist.js")
const fs = require('fs');

function callback(list) { 

    const writeStream = fs.createWriteStream('./public/bars.json');
    const writeStream2 = fs.createWriteStream('./public/bars2.json');
    
    let data1 = [];
    let data2 = [];

    for (let i = 0; i < list.length; i++) {
        if (blacklist.includes(list[i].ticker)) continue;

        const data = JSON.stringify(list[i]);
        
        if (i < 1800) data1.push(data);
        else data2.push(data);
    }

    writeStream.write('[' + data1.join(",") + ']');
    writeStream2.write('[' + data2.join(",") + ']');

    writeStream.end(); 
    writeStream2.end();

    // Optional: Handle any potential write errors
    writeStream.on('error', err => {
        console.error('Error writing to bars.json:', err);
    });
    writeStream2.on('error', err => {
        console.error('Error writing to bars2.json:', err);
    });
}

var barMngr = {

    convertToOneDimensional: function (inputArray, chunkSize=200) {
        let twoDimensionalArray = [];
        for (let i = 0; i < inputArray.length; i += chunkSize) {
          let chunk = inputArray.slice(i, i + chunkSize);
          twoDimensionalArray.push(chunk);
        }
      
        return twoDimensionalArray;
    },

    getMultiBars: async function (tickers) {
        const bars = [];
        let list = this.convertToOneDimensional(tickers, 100)
        for(let i=0; i<list.length; i++) {

        process.stdout.write("\r\x1b[K")
        process.stdout.write(`iteration : ${i*100} / ${tickers.length}`)

        let resp = await alpaca.getMultiBarsV2(list[i], {
            limit: 10000000,
            start: moment().subtract(10000, "days").format(), //  days ago
            end: moment().subtract(0, "days").subtract(20, "minutes").format(), // yesterday
            timeframe: "1Day",
        }, alpaca.configuration
        )

    
            for await (let t of resp) {
                bars.push({
                    ticker: t[0],
                    bars: t[1].map(b => {
                        return {
                        Timestamp: b.Timestamp,
                        OpenPrice: b.OpenPrice,
                        HighPrice: b.HighPrice,
                        LowPrice: b.LowPrice,
                        ClosePrice: b.ClosePrice,
                        Volume: b.Volume
                        }
                    })
                });
           }
        
        
        }

        process.stdout.write("\r\x1b[K")

        callback(bars)
    },

    getMultiBarsRefresh: async function (tickers, tickerList) {
        const bars = [];
        let list = this.convertToOneDimensional(tickers)
        // let lastDate = this.getLatestBarDate(tickerList.filter(t=> t.ticker=='AAPL')[0].bars)
        
        // compare latest date to current date and subtract

        for(let i=0; i<list.length; i++) {

        process.stdout.write("\r\x1b[K")
        process.stdout.write(`iteration : ${i*200} / ${tickers.length}`)

        let resp = await alpaca.getMultiBarsV2(list[i], {
            limit: 10000000,
            start: moment().subtract(10, "days").format(), //  days ago
            end: moment().subtract(0, "days").subtract(20, "minutes").format(), // yesterday
            timeframe: "1Day",
        }, alpaca.configuration
        )

    
            for await (let t of resp) {
                bars.push({
                    ticker: t[0],
                    bars: t[1].map(b => {
                        return {
                        Timestamp: b.Timestamp,
                        OpenPrice: b.OpenPrice,
                        HighPrice: b.HighPrice,
                        LowPrice: b.LowPrice,
                        ClosePrice: b.ClosePrice,
                        Volume: b.Volume
                        }
                    })
                });
           }
        
        }
        const today = new Date();
        startOfYesterday = new Date(today);
        startOfYesterday.setDate(today.getDate() - 1);


        for(t of tickerList) {
            let iterationBars = bars.filter(b=>b.ticker == t.ticker)
            if(iterationBars.length == 0) continue;
            let localBars = iterationBars[0].bars.filter(b=> b.Timestamp > t.bars[t.bars.length-2].Timestamp)
            t.bars.pop()
            for(b of localBars) t.bars.push(b)
        }

        callback(tickerList)
        console.log("Complete")
    },

    getLatestBarDate: function (bars) {
        const lastTimestamp = bars[bars.length-1].Timestamp
        const timestamp = new Date(lastTimestamp).getTime();

    }
}

module.exports=barMngr