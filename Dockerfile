from node:latest
MAINTAINER Joe Miyamoto <joemphilips@gmail.com>
ENV token=CclcTw90sIKx4SDhQ2iarpfU


RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY index.js package.json /usr/src/app/
RUN npm install


CMD ["node", "index.js"]
