# Étape 1 : Utilisation d'une image Node.js
FROM node:18 

# Définition du répertoire de travail
WORKDIR /app

# Installation de nodemon globalement
RUN npm install -g nodemon

# Copie des fichiers package.json et package-lock.json
COPY package.json package-lock.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Expose le port 3000
EXPOSE 3000

# Commande pour lancer le serveur en mode développement avec nodemon
CMD ["npm", "run", "dev"]
