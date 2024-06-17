#Dockerfile

# Use this image as the platform to build the app
FROM node:21-alpine AS builder

# A small line inside the image to show who made it
LABEL Developers="Markus Hamacher"

# The WORKDIR instruction sets the working directory for everything that will happen next
WORKDIR /usr/src/app

# Copy all local files into the image
COPY . .

# Clean install all node modules
RUN npm ci

# remove potential security issues
RUN npm audit fix

# Build SvelteKit app
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /usr/src/app/package*.json ./

RUN npm ci --omit dev

# remove potential security issues
RUN npm audit fix

# The USER instruction sets the user name to use as the default user for the remainder of the current stage
USER node:node

COPY --from=builder /usr/src/app/build ./build/

EXPOSE 3000

# This is the command that will be run inside the image when you tell Docker to start the container
CMD ["node","build/index.js"]