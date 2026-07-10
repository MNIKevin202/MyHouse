FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# CapRover builds the image, so install production dependencies during build.
RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 28206

CMD ["npm", "start"]
