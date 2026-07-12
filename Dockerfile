FROM nginx:alpine

# Clean default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy ONLY app files
COPY tic-tac-toe-app/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
