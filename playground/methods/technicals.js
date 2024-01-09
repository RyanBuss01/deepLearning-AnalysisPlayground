const ta = require("../../methods/ta")

var technicals = {
    findDojis : function (tickerList) {
        let list=[]
        for (t of tickerList) {
            let candles = ta.getHeikinAshi(t.bars)
            if(ta.isDoji(candles[candles.length-1])) list.push(t.ticker)
        }
        console.log(list);
    }

}

module.exports=technicals