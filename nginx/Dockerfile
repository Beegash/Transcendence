FROM nginx:alpine

# Install openssl to generate self-signed certificates during build
RUN apk add --no-cache openssl

# Copy main nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Copy certificate generation script and run it inside the image.
# This removes the need for a pre-existing ./certs directory on the host.
COPY generate-certs.sh /usr/local/bin/generate-certs.sh
RUN chmod +x /usr/local/bin/generate-certs.sh && \
    CERT_DIR=/etc/nginx/certs /usr/local/bin/generate-certs.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
