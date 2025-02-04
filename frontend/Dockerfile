# React build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json from the frontend directory
COPY frontend/package*.json ./ 

RUN npm install

# Copy the entire frontend project
COPY frontend/. .

RUN npm run build

# Nginx server
FROM nginx:alpine

# Remove the default Nginx configuration to avoid conflicts
# RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/

# Copy the built React files to Nginx's web root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]