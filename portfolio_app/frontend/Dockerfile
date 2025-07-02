FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install & run npm build

#from nginx:alpine

COPY . .

#EXPOSE 80

CMD ["npm", "start"]
