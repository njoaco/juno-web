"use client";
import { useState } from "react";

export default function Page() {
  // Estados para entrenar
  const [trainAssetType, setTrainAssetType] = useState("crypto");
  const [trainSymbol, setTrainSymbol] = useState("BTC");
  const [trainLogs, setTrainLogs] = useState("");

  // Estados para predecir
  const [predictAssetType, setPredictAssetType] = useState("crypto");
  const [predictSymbol, setPredictSymbol] = useState("BTC");
  const [predictDays, setPredictDays] = useState("1");
  const [predictLogs, setPredictLogs] = useState("");

  // SSE de entrenamiento
  const startTraining = () => {
    setTrainLogs("Iniciando entrenamiento...\n");
    const url = `/api/train?assetType=${trainAssetType}&symbol=${trainSymbol}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setTrainLogs((prev) => prev + event.data);
    };
    eventSource.addEventListener("error", (event) => {
      setTrainLogs((prev) => prev + "\n[Error SSE] " + event.data);
    });
    eventSource.addEventListener("end", (event) => {
      setTrainLogs((prev) => prev + "\n[Fin] " + event.data);
      eventSource.close();
    });
  };

  // SSE de predicción
  const startPrediction = () => {
    setPredictLogs("Iniciando predicción...\n");
    const url = `/api/predict?assetType=${predictAssetType}&symbol=${predictSymbol}&days=${predictDays}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setPredictLogs((prev) => prev + event.data);
    };
    eventSource.addEventListener("error", (event) => {
      setPredictLogs((prev) => prev + "\n[Error SSE] " + event.data);
    });
    eventSource.addEventListener("end", (event) => {
      setPredictLogs((prev) => prev + "\n[Fin] " + event.data);
      eventSource.close();
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Juno Model SSE</h1>

      <hr />
      <h2>Entrenamiento</h2>
      <div>
        <label>Tipo de Activo:</label>
        <select
          value={trainAssetType}
          onChange={(e) => setTrainAssetType(e.target.value)}
        >
          <option value="crypto">Criptomoneda</option>
          <option value="stock">Acción</option>
        </select>
      </div>
      <div>
        <label>Símbolo:</label>
        <input
          type="text"
          value={trainSymbol}
          onChange={(e) => setTrainSymbol(e.target.value)}
        />
      </div>
      <button onClick={startTraining}>Iniciar Entrenamiento</button>
      <pre style={{ background: "#171717", color: "#fff", padding: "1rem", whiteSpace: "pre-wrap" }}>
        {trainLogs}
      </pre>

      <hr />
      <h2>Predicción</h2>
      <div>
        <label>Tipo de Activo:</label>
        <select
          value={predictAssetType}
          onChange={(e) => setPredictAssetType(e.target.value)}
        >
          <option value="crypto">Criptomoneda</option>
          <option value="stock">Acción</option>
        </select>
      </div>
      <div>
        <label>Símbolo:</label>
        <input
          type="text"
          value={predictSymbol}
          onChange={(e) => setPredictSymbol(e.target.value)}
        />
      </div>
      <div>
        <label>Días a predecir (1-30):</label>
        <input
          type="number"
          min="1"
          max="30"
          value={predictDays}
          onChange={(e) => setPredictDays(e.target.value)}
        />
      </div>
      <button onClick={startPrediction}>Iniciar Predicción</button>
      <pre style={{ background: "#171717", color: "#fff", padding: "1rem", whiteSpace: "pre-wrap" }}>
        {predictLogs}
      </pre>
    </div>
  );
}
