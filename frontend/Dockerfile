FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_API_URL
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]