# Étape 1 : Utilisation d'une image Node.js pour le développement
FROM node:18 

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers package.json et package-lock.json pour installer les dépendances
COPY package.json package-lock.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Expose le port 4200
EXPOSE 4200

# Démarrage de l'application avec Angular CLI
CMD ["npm", "run", "start"]
