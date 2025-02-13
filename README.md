# Juno Model SSE

This project is a web application for training and predicting financial models using Server-Sent Events (SSE). The application supports both cryptocurrency and stock assets.

## Features

- **Training**: Train models for different assets using historical data.
- **Prediction**: Predict future prices for assets and provide recommendations.
- **Real-time Logs**: View real-time logs for training and prediction processes.

## Technologies Used

- **Frontend**: React.js
- **Backend**: Python, TensorFlow, Flask
- **APIs**: TwelveData, CryptoCompare

## Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/juno-model-sse.git
    cd juno-model-sse
    ```

2. Install dependencies:
    ```bash
    npm install
    pip install -r requirements.txt
    ```

3. Create a `.env` file with your API keys:
    ```
    TWELVEDATA_API_KEY=your_twelvedata_api_key
    ```

4. Run the application:
    ```bash
    npm run dev
    ```

## Usage

- Navigate to the web application.
- Select the asset type and symbol for training or prediction.
- Start the training or prediction process and view real-time logs.

## License

This project is licensed under the MIT License.