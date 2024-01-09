var toolsLSTM = {

    bookEnd: function (bars, end) {

        if(end=='min')  return {
            OpenPrice: Math.min(...bars.map(b => b.OpenPrice)),
            ClosePrice: Math.min(...bars.map(b => b.ClosePrice)),
            HighPrice: Math.min(...bars.map(b => b.HighPrice)),
            LowPrice: Math.min(...bars.map(b => b.LowPrice)),
            Volume: Math.min(...bars.map(b => b.Volume)),
            TradeCount: Math.min(...bars.map(b => b.TradeCount)),
            VWAP: Math.min(...bars.map(b => b.VWAP)),
        }
        if(end=='max') return {
            OpenPrice: Math.max(...bars.map(b => b.OpenPrice)),
            ClosePrice: Math.max(...bars.map(b => b.ClosePrice)),
            HighPrice: Math.max(...bars.map(b => b.HighPrice)),
            LowPrice: Math.max(...bars.map(b => b.LowPrice)),
            Volume: Math.max(...bars.map(b => b.Volume)),
            TradeCount: Math.max(...bars.map(b => b.TradeCount)),
            VWAP: Math.max(...bars.map(b => b.VWAP)),
        };
    },

    rnnBookEnd: function (bars, end) {

        if(end=='min')  return {
            change: Math.min(...bars.map(b => b.change)),
            volume: Math.min(...bars.map(b => b.volume)),
        }
        if(end=='max') return {
            change: Math.max(...bars.map(b => b.change)),
            volume: Math.max(...bars.map(b => b.volume)),
        };
    },

    normalize: function (value, min, max) {
        if (max === min) {
            return 0;
        }
        return (value - min) / (max - min);
    },

    denormalize: function (value, min, max) {
        if (max === min) {
            return min;
        }
        return value * (max - min) + min;
    }

}

module.exports=toolsLSTM