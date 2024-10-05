FROM node:10-alpine

RUN mkdir -p /home/node/banjoTab/node_modules && chown -R node:node /home/node/banjoTab/

WORKDIR /home/node/banjoTab

COPY package*.json ./
#making sure the modules are owned by node
USER node

RUN npm install 

#copy all directories to the dockerfile
COPY --chown=node:node . .

#the port used by the website
EXPOSE 3000

#add the database from outside using a docker compose file?

CMD ["node", "app.js"]



