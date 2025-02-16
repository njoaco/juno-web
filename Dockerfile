# Usa Node.js 18 como base (versión slim para menor peso)
FROM node:18-slim as base

# Instala Python 3 + pip + venv + dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    build-essential libssl-dev curl \
 && rm -rf /var/lib/apt/lists/*

# Crea directorio de trabajo
WORKDIR /app

# Copia el archivo de requisitos de Python
COPY requirements.txt ./

# Crea un virtual environment para instalar librerías de Python
RUN python3 -m venv /opt/venv
# Activa el venv en la variable de entorno PATH
ENV PATH="/opt/venv/bin:$PATH"

# Configura variables de entorno para TensorFlow
ENV TF_ENABLE_ONEDNN_OPTS=0
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV CUDA_VISIBLE_DEVICES=-1

# Instala las dependencias Python dentro del venv
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copia los package*.json de Node
COPY package*.json ./

# Instala dependencias de Node
RUN npm install

# Copia el resto del proyecto
COPY . .

# Construye la aplicación Next.js
RUN npm run build

# Expone el puerto 3000
EXPOSE 3000

# Comando por defecto: iniciar Next.js en modo producción
CMD ["npm", "run", "start"]