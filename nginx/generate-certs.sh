#!/bin/sh

# Generate self-signed SSL certificate for development
# This script creates a certificate valid for localhost.
# CERT_DIR can be overridden from the environment (useful in Docker builds).

# Default to "./certs" next to this script if CERT_DIR is not set
CERT_DIR="${CERT_DIR:-$(dirname "$0")/certs}"
mkdir -p "$CERT_DIR"

# Generate SSL private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -subj "/C=TR/ST=Istanbul/L=Istanbul/O=42/OU=ft_transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✅ SSL certificates generated in $CERT_DIR"
echo "   - server.key (private key)"
echo "   - server.crt (certificate)"
echo ""
echo "⚠️  These are self-signed certificates for development only!"
echo "   Your browser will show a security warning - this is expected."
