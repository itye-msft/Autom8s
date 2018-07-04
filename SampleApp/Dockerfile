FROM ityer/k8s-ingress-manager:v2

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# port service
EXPOSE 4001

# helm server 
EXPOSE 4002

# ingress rules
EXPOSE 4003

# Sample app
EXPOSE 4009

CMD [ "npm", "start" ]