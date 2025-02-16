# scripts/train_model.py

import os
# Configuración de variables de entorno antes de cualquier importación que pueda cargar TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Silencia logs de TensorFlow
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Desactiva la GPU
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Desactiva OneDNN

import sys
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import requests
import cryptocompare
import matplotlib.pyplot as plt
from dotenv import load_dotenv

load_dotenv()

look_back = 60
epochs = 100
batch_size = 16 

API_KEY = os.getenv("TWELVEDATA_API_KEY")
if not API_KEY:
    raise ValueError("TWELVEDATA_API_KEY not found in .env file")

save_dir = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(save_dir, exist_ok=True)

def get_stock_data(symbol):
    url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&apikey={API_KEY}&outputsize=2000"
    response = requests.get(url).json()
    if "values" not in response:
        error_message = response.get("message", "Unable to retrieve data.")
        raise ValueError(f"Error fetching data from TwelveData: {error_message}")
    df = pd.DataFrame(response["values"])
    df = df.rename(columns={"close": "close", "high": "high", "low": "low", "volume": "volumeto"})
    df = df.sort_values(by="datetime").reset_index(drop=True)
    return df

def main():
    parser = argparse.ArgumentParser(description="Train model for asset")
    parser.add_argument("--asset_type", type=str, choices=["crypto", "stock"], required=True, help="Asset type: crypto o stock")
    parser.add_argument("--symbol", type=str, required=True, help="Asset symbol")
    args = parser.parse_args()

    asset_type = args.asset_type
    symbol = args.symbol.upper()
    
    if asset_type == "crypto":
        price_data = cryptocompare.get_price(symbol, currency='USD')
        if symbol not in price_data:
            raise ValueError(f"Error fetching current price for {symbol}")
        current_price = price_data[symbol]['USD']
        print(f"Current price of {symbol}: ${current_price:.2f} USD")
        sys.stdout.flush()
        hist_data = cryptocompare.get_historical_price_day(symbol, currency="USD", limit=2000)
        df = pd.DataFrame(hist_data)
    else:
        df = get_stock_data(symbol)
        current_price = float(df.iloc[-1]['close'])
        print(f"Current price of {symbol}: ${current_price:.2f} USD")
        sys.stdout.flush()
    
    df = df.rename(columns={"close": "close", "high": "high", "low": "low", "volume": "volumeto"})
    df = df.dropna()
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    df_scaled = scaler.fit_transform(df[["close", "high", "low", "volumeto"]])
    
    scaler_path = os.path.join(save_dir, f"scaler_{symbol}.pkl")
    joblib.dump(scaler, scaler_path)
    
    X, y = [], []
    for i in range(len(df_scaled) - look_back - 30):
        X.append(df_scaled[i : i + look_back, 0])
        y.append(df_scaled[i + look_back : i + look_back + 30, 0])
    
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    plt.ioff()  # Desactiva el modo interactivo de matplotlib
    
    class LossCallback(tf.keras.callbacks.Callback):
        def on_epoch_end(self, epoch, logs=None):
            print(f"Epoch {epoch+1}/{epochs} - Loss: {logs['loss']:.6f}")
            sys.stdout.flush()

    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(100, return_sequences=True, input_shape=(X.shape[1], 1)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.LSTM(100),
        tf.keras.layers.Dense(50, activation='relu'),
        tf.keras.layers.Dense(30)
    ])
    
    model.compile(optimizer="adam", loss="mean_squared_error")
    
    print(f"Training model for {symbol} with {epochs} epochs...")
    sys.stdout.flush()
    
    model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0, callbacks=[LossCallback()])
    
    model_path = os.path.join(save_dir, f"model_{symbol}.h5")
    model.save(model_path)
    
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")
    sys.stdout.flush()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        sys.exit(1)
