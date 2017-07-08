from node:latest
MAINTAINER Joe Miyamoto <joemphilips@gmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY src /usr/src/app/
RUN npm install --production --no-progress && npm cache verify

COPY . /usr/src/app/

EXPOSE 3000

CMD ["node", "index.js"]
