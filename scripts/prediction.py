# scripts/prediction.py
import os
import sys

# Fuerza stdout a UTF-8 en Python 3.7+ (especialmente en Windows)
# Esto previene el error de 'charmap' codec cuando TF imprime caracteres fuera de la página de códigos local.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
from datetime import datetime
import requests
import cryptocompare
from dotenv import load_dotenv

# Desactiva algunos warnings de TF (opcional)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

load_dotenv()

window_size = 60

save_dir = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(save_dir, exist_ok=True)

API_KEY = os.getenv("TWELVEDATA_API_KEY")
if not API_KEY:
    raise ValueError("TWELVEDATA_API_KEY not found in .env file")

def get_stock_data(symbol):
    """
    Obtiene datos de acciones desde la API de TwelveData,
    usando la variable global API_KEY.
    """
    url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&apikey={API_KEY}&outputsize={window_size}"
    response = requests.get(url).json()
    if "values" not in response:
        raise ValueError("Error fetching data from TwelveData: " + response.get("message", "Unable to retrieve data."))
    df = pd.DataFrame(response["values"])
    df = df.rename(columns={"close": "close", "high": "high", "low": "low", "volume": "volumeto"})
    df = df.sort_values(by="datetime").reset_index(drop=True)
    return df

def main():
    parser = argparse.ArgumentParser(description="Make prediction for asset")
    parser.add_argument("--asset_type", type=str, choices=["crypto", "stock"], required=True, help="Asset type: crypto or stock")
    parser.add_argument("--symbol", type=str, required=True, help="Asset symbol")
    parser.add_argument("--days", type=int, required=True, help="Number of days to predict (1-30)")
    args = parser.parse_args()

    asset_type = args.asset_type
    symbol = args.symbol.upper()
    days = args.days

    print(f"[INFO] Starting prediction for {symbol}, {days} day(s) ahead...")
    sys.stdout.flush()

    # Obtiene el precio actual y el histórico
    if asset_type == "crypto":
        # Precio actual
        price_data = cryptocompare.get_price(symbol, currency='USD')
        if not price_data or symbol not in price_data:
            print(f"[ERROR] Error fetching current price for {symbol}")
            sys.stdout.flush()
            sys.exit(1)
        current_price = price_data[symbol]['USD']
        print(f"[INFO] Current price of {symbol}: ${current_price:.2f} USD")
        sys.stdout.flush()

        # Histórico
        hist_data = cryptocompare.get_historical_price_day(symbol, currency="USD", limit=window_size)
        if not hist_data or len(hist_data) < window_size:
            print(f"[ERROR] Not enough historical data for {symbol}")
            sys.stdout.flush()
            sys.exit(1)

        df_hist = pd.DataFrame(hist_data)[['close', 'high', 'low', 'volumeto']]
    else:
        df = get_stock_data(symbol)
        if df.empty or len(df) < window_size:
            print(f"[ERROR] Not enough stock data for {symbol}")
            sys.stdout.flush()
            sys.exit(1)
        current_price = float(df.iloc[-1]['close'])
        print(f"[INFO] Current price of {symbol}: ${current_price:.2f} USD")
        sys.stdout.flush()

        df_hist = df[['close', 'high', 'low', 'volumeto']]

    # Cargar scaler y modelo
    scaler_path = os.path.join(save_dir, f"scaler_{symbol}.pkl")
    model_path = os.path.join(save_dir, f"model_{symbol}.h5")

    if not os.path.exists(scaler_path):
        print(f"[ERROR] Scaler for {symbol} not found. Please train the model first.")
        sys.stdout.flush()
        sys.exit(1)
    if not os.path.exists(model_path):
        print(f"[ERROR] Model for {symbol} not found. Please train the model first.")
        sys.stdout.flush()
        sys.exit(1)

    scaler = joblib.load(scaler_path)
    model = tf.keras.models.load_model(model_path)
    # Asegurarse de que el modelo esté compilado (por si no se guardó con compile=True)
    if not model.optimizer:
        model.compile(optimizer='adam', loss='mse')

    # Escalar datos y preparar la secuencia de entrada
    data_scaled = scaler.transform(df_hist)
    # input_sequence = últimas 60 filas, solo la columna 0 (close escalado)
    input_sequence = data_scaled[-window_size:, 0].reshape(1, window_size, 1)

    # Predicción
    try:
        predicted_sequence = model.predict(input_sequence)[0]
    except Exception as e:
        print(f"[ERROR] Error during prediction: {e}")
        sys.stdout.flush()
        sys.exit(1)

    # Reconstruir 30 valores dummy para "desescalar"
    dummy_data = np.zeros((30, 4))
    dummy_data[:, 0] = predicted_sequence
    predicted_prices = scaler.inverse_transform(dummy_data)[:, 0]

    # Tomamos la predicción para "days" (1-index)
    predicted_price = predicted_prices[days - 1]
    print(f"[INFO] Prediction for day {days}: ${predicted_price:.2f} USD")
    sys.stdout.flush()

    # Recomendación
    percentage_change = ((predicted_price - current_price) / current_price) * 100
    if percentage_change > 5:
        recommendation = "Buy"
    elif percentage_change < -5:
        recommendation = "Sell"
    else:
        recommendation = "Hold"

    print(f"[INFO] Recommendation: {recommendation} (Change: {percentage_change:.2f}%)")
    sys.stdout.flush()

    # Guardamos reporte en /predictions
    prediction_dir = os.path.join(os.path.dirname(__file__), "..", "predictions")
    os.makedirs(prediction_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(prediction_dir, f"pred_{symbol}_{timestamp}.txt")

    report_content = f"""=== Prediction for {symbol} ===
Date/Time: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
Current Price: ${current_price:.2f}
Predicted Day: {days}
Predicted Price: ${predicted_price:.2f}
Recommendation: {recommendation} (Change: {percentage_change:.2f}%)
30-Day History:
""" + "\n".join([f"Day {i+1}: ${price:.2f}" for i, price in enumerate(predicted_prices)])

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(report_content)

    print(f"[INFO] Prediction saved to {filename}")
    sys.stdout.flush()

if __name__ == "__main__":
    main()
