FROM ityer/dotnet-node-alpine:net2.1-node9.11-alpine3.7

# Create app directory
WORKDIR /usr/src/port-service

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 4001
CMD [ "npm", "start" ]