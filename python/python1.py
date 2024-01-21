from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.optimizers import Adam
from sklearn.metrics import mean_squared_error
import numpy as np
from dataHandler import DataHandler

ticker_input = 'PEP'

closePrices = DataHandler.getClosePrice(ticker_input)
# Data preprocessing
data = np.array(closePrices).reshape(-1, 1)  # Reshape the data
data_normalized = data / np.max(data)  # Normalize the data

# Split the data into training and testing sets
train_size = int(len(data_normalized) * 0.8)
train_data = data_normalized[:train_size]
test_data = data_normalized[train_size:]

# Function to create LSTM model
def create_lstm_model(units, activation, learning_rate):
    model = Sequential()
    model.add(LSTM(units=units, activation=activation, input_shape=(1, 1)))
    model.add(Dense(units=1))
    optimizer = Adam(learning_rate=learning_rate)  # Use the legacy Adam optimizer

    model.compile(optimizer=optimizer, loss='mean_squared_error')
    return model

# Define hyperparameters for tuning
lstm_units = [50, 100, 200]
lstm_activations = ['relu', 'tanh']
learning_rates = [0.001, 0.01, 0.1]
epochs = 100
batch_size = 32

# Perform hyperparameter tuning for LSTM model
best_rmse = float('inf')
best_lstm_model = None


for units in lstm_units:
    for activation in lstm_activations:
        for learning_rate in learning_rates:
            # Create and train LSTM model
            model = create_lstm_model(units=units, activation=activation, learning_rate=learning_rate)
            model.fit(train_data[:-1].reshape(-1, 1, 1), train_data[1:], epochs=epochs, batch_size=batch_size, verbose=0)

            # Predict on test data
            test_predictions = model.predict(test_data[:-1].reshape(-1, 1, 1)).flatten()

            # Calculate RMSE
            rmse = np.sqrt(mean_squared_error(test_data[1:], test_predictions))

            # Check if current model has lower RMSE
            if rmse < best_rmse:
                best_rmse = rmse
                best_lstm_model = model


# Predict on the entire dataset using the best LSTM model
all_lstm_predictions = best_lstm_model.predict(data_normalized[:-1].reshape(-1, 1, 1)).flatten()

# Inverse normalize the LSTM predictions
all_lstm_predictions = all_lstm_predictions * np.max(data)



######### Predicting the Future Price #########

def predict_future_prices(model, last_data_point, num_predictions, scaling_factor):
    future_predictions = []
    input_data = last_data_point

    for _ in range(num_predictions):
        # Predict the next time step
        prediction = model.predict(input_data.reshape(1, 1, 1))[0][0]

        # Append the prediction
        future_predictions.append(prediction)

        # Update the input data with the predicted value
        input_data = np.array([[prediction]])

    # Inverse normalize the predictions
    future_predictions = np.array(future_predictions) * scaling_factor

    return future_predictions

# Predict the next 10 days using the LSTM model
num_predictions = 10
last_data_point = data_normalized[-1]  # Last available data point
scaling_factor = np.max(data)  # Scaling factor for inverse normalization

future_predictions = predict_future_prices(best_lstm_model, last_data_point, num_predictions, scaling_factor)

# Print the predicted values for the next 10 days
print("Predicted Stock Prices for the Next 10 Days:")
for i, prediction in enumerate(future_predictions, 1):
    print(f"Day {i}: {prediction:.2f}")