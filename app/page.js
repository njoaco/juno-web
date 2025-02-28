"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowRight, BarChart2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

export default function Page() {
  const [trainAssetType, setTrainAssetType] = useState("crypto")
  const [trainSymbol, setTrainSymbol] = useState("BTC")
  const [trainLogs, setTrainLogs] = useState("")
  const [isTraining, setIsTraining] = useState(false)

  const [predictAssetType, setPredictAssetType] = useState("crypto")
  const [predictSymbol, setPredictSymbol] = useState("BTC")
  const [predictDays, setPredictDays] = useState("1")
  const [predictLogs, setPredictLogs] = useState("")
  const [isPredicting, setIsPredicting] = useState(false)

  const trainLogRef = useRef(null)
  const predictLogRef = useRef(null)

  useEffect(() => {
    if (trainLogRef.current) {
      trainLogRef.current.scrollTop = trainLogRef.current.scrollHeight
    }
  }, [trainLogRef])

  useEffect(() => {
    if (predictLogRef.current) {
      predictLogRef.current.scrollTop = predictLogRef.current.scrollHeight
    }
  }, [predictLogRef])

  const startTraining = () => {
    setIsTraining(true)
    setTrainLogs("Starting training...\n")
    const url = `/api/train?assetType=${trainAssetType}&symbol=${trainSymbol}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      setTrainLogs((prev) => prev + event.data + "\n")
    }
    eventSource.addEventListener("error", (event) => {
      setTrainLogs((prev) => prev + "\n[SSE Error] " + event.data + "\n")
    })
    eventSource.addEventListener("end", (event) => {
      setTrainLogs((prev) => prev + "\n[End] " + event.data + "\n")
      eventSource.close()
      setIsTraining(false)
    })
  }

  const startPrediction = () => {
    setIsPredicting(true)
    setPredictLogs("Starting prediction...\n")
    const url = `/api/predict?assetType=${predictAssetType}&symbol=${predictSymbol}&days=${predictDays}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      setPredictLogs((prev) => prev + event.data + "\n")
    }
    eventSource.addEventListener("error", (event) => {
      setPredictLogs((prev) => prev + "\n[SSE Error] " + event.data + "\n")
    })
    eventSource.addEventListener("end", (event) => {
      setPredictLogs((prev) => prev + "\n[End] " + event.data + "\n")
      eventSource.close()
      setIsPredicting(false)
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-8 text-center"
      >
        Juno Model SSE Mini
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 p-6 rounded-lg shadow-md w-full"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <RefreshCw className="mr-2" /> Training
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Asset Type:</label>
              <select
                value={trainAssetType}
                onChange={(e) => setTrainAssetType(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
              >
                <option value="crypto">Cryptocurrency</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Symbol:</label>
              <input
                type="text"
                value={trainSymbol}
                onChange={(e) => setTrainSymbol(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTraining}
              disabled={isTraining}
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center ${isTraining ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isTraining ? "Training..." : "Start Training"} <ArrowRight className="ml-2" />
            </motion.button>
          </div>
          <div className="mt-4 bg-gray-900 p-4 rounded-lg h-48 w-full max-w-full">
            <pre
              ref={trainLogRef}
              className="h-full w-full overflow-auto font-mono text-sm whitespace-pre-wrap break-all"
              style={{ maxWidth: "100%" }}
            >
              {trainLogs}
            </pre>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800 p-6 rounded-lg shadow-md w-full"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <BarChart2 className="mr-2" /> Prediction
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Asset Type:</label>
              <select
                value={predictAssetType}
                onChange={(e) => setPredictAssetType(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
              >
                <option value="crypto">Cryptocurrency</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Symbol:</label>
              <input
                type="text"
                value={predictSymbol}
                onChange={(e) => setPredictSymbol(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block mb-1">Days to Predict (1-30):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={predictDays}
                onChange={(e) => setPredictDays(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startPrediction}
              disabled={isPredicting}
              className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center ${isPredicting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPredicting ? "Predicting..." : "Start Prediction"} <ArrowRight className="ml-2" />
            </motion.button>
          </div>
          <div className="mt-4 bg-gray-900 p-4 rounded-lg h-48 w-full max-w-full">
            <pre
              ref={predictLogRef}
              className="h-full w-full overflow-auto font-mono text-sm whitespace-pre-wrap break-all"
              style={{ maxWidth: "100%" }}
            >
              {predictLogs}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  )
}