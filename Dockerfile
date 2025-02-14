# Usa Node.js 18 como base
FROM node:18 as base

# Instala Python 3, pip y dependencias del sistema
RUN apt-get update && apt-get install -y python3 python3-pip build-essential libssl-dev curl && rm -rf /var/lib/apt/lists/*

# Crea directorio de trabajo
WORKDIR /app

# Copia primero requirements de Python
COPY requirements.txt ./

# Instala dependencias de Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copia los package*.json de Node
COPY package*.json ./

# Instala dependencias de Node
RUN npm install

# Copia el resto del proyecto al contenedor
COPY . .

# Construye la aplicación Next.js
RUN npm run build

# Expone el puerto 3000 (Next.js)
EXPOSE 3000

# Comando por defecto: arrancar Next.js en modo producción
CMD ["npm", "run", "start"]