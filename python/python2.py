import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Softmax, LSTM
from tensorflow.keras.optimizers import Adam
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from dataHandler import DataHandler


############## Pre-Proccessing ##############

ticker_input = 'PEP'
closePrices = DataHandler.getClosePrice(ticker_input)
[print(closePrices)]

close_prices = np.array(closePrices) 
percent_changes = np.diff(close_prices) / close_prices[:-1] * 100

scaler = MinMaxScaler(feature_range=(0, 1))
normalized_data = scaler.fit_transform(percent_changes.reshape(-1, 1))

def create_sequences(data, sequence_length):
    x, y = [], []
    for i in range(len(data) - sequence_length):
        seq = data[i:i + sequence_length]
        x.append(seq[:-1])  # All but the last element for input
        y.append(seq[-1])   # The last element for target
    return np.array(x), np.array(y)

sequence_length = 30  # Using the past 30 days
x_sequences, y_sequences = create_sequences(normalized_data, sequence_length)

train_size = int(len(x_sequences) * 0.8)
x_train = x_sequences[:train_size]
y_train = y_sequences[:train_size]
x_test = x_sequences[train_size:]
y_test = y_sequences[train_size:]


# Define your LSTM model
model = Sequential()
model.add(LSTM(units=50, return_sequences=True, input_shape=(sequence_length-1, 1)))
model.add(LSTM(units=50))
model.add(Dense(1))

model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
model.fit(x_train, y_train, epochs=50, batch_size=32)


# Model Prediction and Evaluation
predictions = model.predict(x_test)
inverse_predictions = scaler.inverse_transform(predictions)

print(inverse_predictions)


