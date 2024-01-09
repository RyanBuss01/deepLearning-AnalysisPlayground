var tools = {
    mean: function(data, print=false) {
        if(print == true) {console.log("\nData: ", data)}
        return data.reduce(function (a, b) {
            return Number(a) + Number(b);
        }) / data.length;
    },

    sum: function (data) {
        return data.reduce((sum, current) => sum + current, 0);
    },

    pDiff: function (a, b) {
        var difference = Number(b) - Number(a);
        var percentage = (difference / Number(a)) * 100;
        return Number(percentage.toFixed(2));
    },

    isString: function (str) {
        return /^[a-zA-Z]+$/.test(str);
    },

    haToBarTranslator(candles) {
        return candles.map(c=>{
            return {
                HighPrice: c.high,
                LowPrice: c.low,
                OpenPrice: c.open,
                ClosePrice: c.close
            }
        })
    }

}

module.exports=tools