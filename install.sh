#!/usr/bin/env bash

# ==============================================================================
# 🚀 KawduLive - Complete Linux Installation & Production Deployment Script
# Domain: kawdulive.qzz.io
# Server IP: 139.99.72.98
# SSL Cert: /etc/letsencrypt/live/kawdulive.qzz.io/fullchain.pem
# SSL Key:  /etc/letsencrypt/live/kawdulive.qzz.io/privkey.pem
# Features: Full-Stack WebRTC, Mediasoup SFU, CoTURN, Nginx Proxy & PM2 Daemon
# ==============================================================================

set -e

# ANSI Color Codes
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SERVER_DOMAIN="kawdulive.qzz.io"
SERVER_IP="139.99.72.98"
LE_CERT="/etc/letsencrypt/live/${SERVER_DOMAIN}/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/${SERVER_DOMAIN}/privkey.pem"

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "    🚀 KAWDU LIVE (kawdulive.qzz.io) - AUTOMATED LINUX PRODUCTION INSTALLER"
echo "    Dedicated Host: ${SERVER_DOMAIN} (${SERVER_IP})"
echo "    Architecture: WebRTC Mediasoup SFU, CoTURN Relay, Nginx & PM2 Daemon"
echo "=============================================================================="
echo -e "${NC}"

# Check for root / sudo privileges
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
  IS_ROOT=true
else
  echo -e "${YELLOW}ℹ️  Script running as non-root user ($(whoami)). Using sudo for system commands.${NC}"
fi

# Detect Current Directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Helper for sudo execution
run_cmd() {
  if [ "$IS_ROOT" = true ]; then
    "$@"
  else
    sudo "$@"
  fi
}

# ------------------------------------------------------------------------------
# 1. Detect Operating System & Package Manager
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/9] Detecting Operating System & Package Manager...${NC}"

OS="unknown"
PKG_MANAGER=""

if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
fi

if command -v apt-get &> /dev/null; then
  PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
  PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
  PKG_MANAGER="yum"
elif command -v pacman &> /dev/null; then
  PKG_MANAGER="pacman"
fi

echo -e "      Detected OS: ${BOLD}${OS}${NC} (Package Manager: ${PKG_MANAGER:-None})"

# ------------------------------------------------------------------------------
# 2. Install Essential System Build Tools, Nginx, CoTURN & OpenSSL
# ------------------------------------------------------------------------------
echo -e "${CYAN}[2/9] Installing System Packages (Build Tools, Nginx, CoTURN, OpenSSL)...${NC}"

if [ "$PKG_MANAGER" = "apt" ]; then
  export DEBIAN_FRONTEND=noninteractive
  run_cmd apt-get update -y
  run_cmd apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    pkg-config \
    openssl \
    coturn \
    nginx \
    ufw \
    ca-certificates \
    gnupg
elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
  run_cmd $PKG_MANAGER update -y
  run_cmd $PKG_MANAGER install -y \
    curl \
    wget \
    git \
    make \
    gcc \
    gcc-c++ \
    python3 \
    openssl \
    openssl-devel \
    coturn \
    nginx \
    firewalld
elif [ "$PKG_MANAGER" = "pacman" ]; then
  run_cmd pacman -Sy --noconfirm \
    curl \
    wget \
    git \
    base-devel \
    python \
    openssl \
    coturn \
    nginx \
    ufw
fi

# ------------------------------------------------------------------------------
# 3. Verify / Install Node.js (v20+ LTS) and Global PM2 / TSX
# ------------------------------------------------------------------------------
echo -e "${CYAN}[3/9] Verifying Node.js Environment...${NC}"

NODE_OK=false
if command -v node &> /dev/null; then
  NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    NODE_OK=true
    echo -e "      ${GREEN}✓ Node.js $(node -v) is already installed.${NC}"
  fi
fi

if [ "$NODE_OK" = false ]; then
  echo -e "      Installing Node.js 20 LTS..."
  if [ "$PKG_MANAGER" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | run_cmd bash -
    run_cmd apt-get install -y nodejs
  elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | run_cmd bash -
    run_cmd $PKG_MANAGER install -y nodejs
  else
    echo -e "${RED}❌ Please install Node.js 20+ manually and re-run install.sh${NC}"
    exit 1
  fi
fi

# Install PM2 Process Manager globally if missing
if ! command -v pm2 &> /dev/null; then
  echo -e "      Installing PM2 process manager globally..."
  run_cmd npm install -g pm2 tsx
else
  echo -e "      ${GREEN}✓ PM2 process manager is available.${NC}"
fi

# ------------------------------------------------------------------------------
# 4. Configure Environment (.env) for kawdulive.qzz.io
# ------------------------------------------------------------------------------
echo -e "${CYAN}[4/9] Writing Environment Configuration (.env)...${NC}"

cat <<EOF > .env
# KawduLive Server Environment Configuration
SERVER_DOMAIN=${SERVER_DOMAIN}
SERVER_IP=${SERVER_IP}
VITE_SERVER_DOMAIN=${SERVER_DOMAIN}
VITE_SERVER_IP=${SERVER_IP}
PORT=3000
ADMIN_PORT=3001

# SSL Certificates (Let's Encrypt / System Path)
SSL_CERT_PATH=${LE_CERT}
SSL_KEY_PATH=${LE_KEY}

# WebRTC Mediasoup & CoTURN Relay Configuration
COTURN_HOST=${SERVER_DOMAIN}
COTURN_IP=${SERVER_IP}
COTURN_PORT=3478
COTURN_TURNS_PORT=5349
COTURN_REALM=${SERVER_DOMAIN}
COTURN_USER=youngpapi_turn_user
COTURN_SECRET=youngpapi_turn_secure_token

# MySQL Database Configuration
MYSQL_HOST=${SERVER_IP}
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=youngpapi-live-db

# Optional AI Key for Avatar and Content Generation
GEMINI_API_KEY=
EOF

echo -e "      ${GREEN}✓ .env configured for domain ${BOLD}${SERVER_DOMAIN}${NC} (${SERVER_IP})"

# ------------------------------------------------------------------------------
# 5. Setup SSL/TLS Certificates (Let's Encrypt / Multi-SAN Fallback)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[5/9] Setting up SSL/TLS Certificates & Permission Hardening...${NC}"

# Ensure dedicated system directory for KawduLive SSL certs
run_cmd mkdir -p /etc/ssl/kawdulive

# Detect Let's Encrypt certificates
USE_LETSENCRYPT=false
if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
  USE_LETSENCRYPT=true
  echo -e "      ${GREEN}✓ Found Let's Encrypt certificates for ${SERVER_DOMAIN}!${NC}"
  echo -e "        Certificate: ${LE_CERT}"
  echo -e "        Private Key: ${LE_KEY}"

  # Fix parent directory traversal permissions so Nginx (www-data/nginx) and CoTURN (turnserver) can read certs
  run_cmd chmod 755 /etc/letsencrypt 2>/dev/null || true
  run_cmd chmod 755 /etc/letsencrypt/live 2>/dev/null || true
  run_cmd chmod 755 /etc/letsencrypt/archive 2>/dev/null || true
  run_cmd chmod 755 /etc/letsencrypt/live/${SERVER_DOMAIN} 2>/dev/null || true
  run_cmd chmod 755 /etc/letsencrypt/archive/${SERVER_DOMAIN} 2>/dev/null || true

  # Copy dereferenced certificates to /etc/ssl/kawdulive/ for CoTURN and local Node
  run_cmd cp -L "$LE_CERT" /etc/ssl/kawdulive/cert.pem
  run_cmd cp -L "$LE_KEY" /etc/ssl/kawdulive/privkey.pem
  run_cmd cp -L "$LE_CERT" "${SCRIPT_DIR}/localhost.pem"
  run_cmd cp -L "$LE_KEY" "${SCRIPT_DIR}/localhost-key.pem"

  # Create an automated Let's Encrypt renewal hook to keep CoTURN, Nginx, and Node synced
  RENEWAL_HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
  if [ -d "/etc/letsencrypt" ]; then
    run_cmd mkdir -p "$RENEWAL_HOOK_DIR"
    cat <<'HOOK_EOF' | run_cmd tee "${RENEWAL_HOOK_DIR}/kawdulive-sync.sh" > /dev/null
#!/usr/bin/env bash
DOMAIN="kawdulive.qzz.io"
if [ "$RENEWED_LINEAGE" = "/etc/letsencrypt/live/$DOMAIN" ] || [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  mkdir -p /etc/ssl/kawdulive
  cp -L "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /etc/ssl/kawdulive/cert.pem
  cp -L "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /etc/ssl/kawdulive/privkey.pem
  chmod 644 /etc/ssl/kawdulive/*.pem
  if id -u turnserver &>/dev/null; then
    chown -R turnserver:turnserver /etc/ssl/kawdulive 2>/dev/null || true
  fi
  systemctl reload nginx 2>/dev/null || true
  systemctl restart coturn 2>/dev/null || true
  pm2 restart kawdulive 2>/dev/null || true
fi
HOOK_EOF
    run_cmd chmod +x "${RENEWAL_HOOK_DIR}/kawdulive-sync.sh"
    echo -e "      ${GREEN}✓ Let's Encrypt auto-renewal hook installed (${RENEWAL_HOOK_DIR}/kawdulive-sync.sh)${NC}"
  fi
else
  echo -e "      ${YELLOW}ℹ️  Let's Encrypt not found at ${LE_CERT}. Generating self-signed multi-SAN certificate...${NC}"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout localhost-key.pem \
    -out localhost.pem \
    -days 3650 \
    -subj "/C=MY/ST=KualaLumpur/L=KualaLumpur/O=KawduLive/CN=${SERVER_DOMAIN}" \
    -addext "subjectAltName=DNS:${SERVER_DOMAIN},DNS:*.${SERVER_DOMAIN},DNS:localhost,IP:${SERVER_IP},IP:127.0.0.1" 2>/dev/null || true

  run_cmd cp -f localhost.pem /etc/ssl/kawdulive/cert.pem
  run_cmd cp -f localhost-key.pem /etc/ssl/kawdulive/privkey.pem
fi

# Set proper permissions on KawduLive SSL directory
run_cmd chmod 644 /etc/ssl/kawdulive/cert.pem /etc/ssl/kawdulive/privkey.pem "${SCRIPT_DIR}/localhost.pem" "${SCRIPT_DIR}/localhost-key.pem" 2>/dev/null || true

if id -u turnserver &>/dev/null; then
  run_cmd chown -R turnserver:turnserver /etc/ssl/kawdulive || true
fi

echo -e "      ${GREEN}✓ SSL certificate pair configured in /etc/ssl/kawdulive/${NC}"

# ------------------------------------------------------------------------------
# 6. Configure CoTURN STUN/TURN Daemon for WebRTC Video/Audio Relay
# ------------------------------------------------------------------------------
echo -e "${CYAN}[6/9] Configuring CoTURN WebRTC Server...${NC}"

if command -v turnserver &> /dev/null; then
  TURN_CONF="/etc/turnserver.conf"

  # Backup original configuration if exists
  if [ -f "$TURN_CONF" ] && [ ! -f "${TURN_CONF}.bak" ]; then
    run_cmd cp "$TURN_CONF" "${TURN_CONF}.bak"
  fi

  cat <<EOF | run_cmd tee "$TURN_CONF" > /dev/null
# KawduLive CoTURN Server Configuration
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=${SERVER_IP}

# Credentials & Realm
server-name=${SERVER_DOMAIN}
realm=${SERVER_DOMAIN}
user=youngpapi_turn_user:youngpapi_turn_secure_token

# Certificates for TURNS TLS (port 5349)
cert=/etc/ssl/kawdulive/cert.pem
pkey=/etc/ssl/kawdulive/privkey.pem

# RTP Media Ports Range
min-port=49152
max-port=65535

# Performance, Integrity & Security
fingerprint
lt-cred-mech
stale-nonce
no-loopback-peers
no-multicast-peers
mobility
verbose
EOF

  # Enable coturn service in Ubuntu / Debian default configuration
  if [ -f /etc/default/coturn ]; then
    run_cmd sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
    run_cmd sed -i 's/TURNSERVER_ENABLED=0/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
  fi

  run_cmd systemctl daemon-reload &>/dev/null || true
  run_cmd systemctl enable coturn &>/dev/null || true
  run_cmd systemctl restart coturn &>/dev/null || true
  echo -e "      ${GREEN}✓ CoTURN server running on ${SERVER_DOMAIN}:3478 & 5349${NC}"
else
  echo -e "      ${YELLOW}⚠️  turnserver binary not found. Skipping daemon restart.${NC}"
fi

# ------------------------------------------------------------------------------
# 7. Configure Nginx Reverse Proxy (Port 80/443 -> Port 3000 & 3001)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[7/9] Configuring Nginx Reverse Proxy for ${SERVER_DOMAIN}...${NC}"

# Choose certificate paths for Nginx
if [ "$USE_LETSENCRYPT" = true ]; then
  NGINX_SSL_CERT="$LE_CERT"
  NGINX_SSL_KEY="$LE_KEY"
else
  NGINX_SSL_CERT="/etc/ssl/kawdulive/cert.pem"
  NGINX_SSL_KEY="/etc/ssl/kawdulive/privkey.pem"
fi

if command -v nginx &> /dev/null; then
  NGINX_CONF_DIR="/etc/nginx/sites-available"
  NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

  if [ -d "$NGINX_CONF_DIR" ]; then
    cat <<EOF | run_cmd tee "${NGINX_CONF_DIR}/kawdulive.conf" > /dev/null
# KawduLive Nginx Reverse Proxy Configuration (HTTP & HTTPS)
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_DOMAIN} ${SERVER_IP} localhost;

    client_max_body_size 50M;

    # Let's Encrypt Certbot challenge support
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Primary Web Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Real-Time WebSocket Channel
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebRTC PeerJS Signaling
    location /peerjs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Dedicated Admin Portal Proxy
    location /admin-portal/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${SERVER_DOMAIN} ${SERVER_IP} localhost;

    ssl_certificate ${NGINX_SSL_CERT};
    ssl_certificate_key ${NGINX_SSL_KEY};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    # Primary Web Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Real-Time WebSocket Channel
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebRTC PeerJS Signaling
    location /peerjs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Dedicated Admin Portal Proxy
    location /admin-portal/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

    # Enable site symlink
    run_cmd ln -sf "${NGINX_CONF_DIR}/kawdulive.conf" "${NGINX_ENABLED_DIR}/kawdulive.conf" || true
    # Remove default welcome site if present
    run_cmd rm -f "${NGINX_ENABLED_DIR}/default" &>/dev/null || true

    # Test and reload Nginx
    if run_cmd nginx -t &>/dev/null; then
      run_cmd systemctl enable nginx &>/dev/null || true
      run_cmd systemctl restart nginx &>/dev/null || true
      echo -e "      ${GREEN}✓ Nginx proxy configured: http://${SERVER_DOMAIN} & https://${SERVER_DOMAIN}${NC}"
    else
      echo -e "      ${YELLOW}⚠️  Nginx configuration test note. Direct port access retained.${NC}"
    fi
  elif [ -d "/etc/nginx/conf.d" ]; then
    cat <<EOF | run_cmd tee "/etc/nginx/conf.d/kawdulive.conf" > /dev/null
server {
    listen 80;
    server_name ${SERVER_DOMAIN} ${SERVER_IP} localhost;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
server {
    listen 443 ssl;
    server_name ${SERVER_DOMAIN} ${SERVER_IP} localhost;
    ssl_certificate ${NGINX_SSL_CERT};
    ssl_certificate_key ${NGINX_SSL_KEY};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
    run_cmd systemctl enable nginx &>/dev/null || true
    run_cmd systemctl restart nginx &>/dev/null || true
    echo -e "      ${GREEN}✓ Nginx conf.d proxy configured for ${SERVER_DOMAIN}${NC}"
  fi
fi

# ------------------------------------------------------------------------------
# 8. Configure Firewall Security Rules (UFW / Firewalld)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[8/9] Applying Firewall Security Rules...${NC}"

if command -v ufw &> /dev/null; then
  run_cmd ufw allow 22/tcp comment 'SSH' &>/dev/null || true
  run_cmd ufw allow 80/tcp comment 'HTTP Nginx Proxy' &>/dev/null || true
  run_cmd ufw allow 443/tcp comment 'HTTPS Nginx Proxy' &>/dev/null || true
  run_cmd ufw allow 3000/tcp comment 'KawduLive Web App' &>/dev/null || true
  run_cmd ufw allow 3001/tcp comment 'KawduLive Admin Portal' &>/dev/null || true
  run_cmd ufw allow 3478/tcp comment 'CoTURN STUN/TURN TCP' &>/dev/null || true
  run_cmd ufw allow 3478/udp comment 'CoTURN STUN/TURN UDP' &>/dev/null || true
  run_cmd ufw allow 5349/tcp comment 'CoTURN TURNS TLS TCP' &>/dev/null || true
  run_cmd ufw allow 5349/udp comment 'CoTURN TURNS TLS UDP' &>/dev/null || true
  run_cmd ufw allow 49152:65535/udp comment 'WebRTC Media Streaming' &>/dev/null || true
  echo -e "      ${GREEN}✓ Firewall ports open (80, 443, 3000, 3001, 3478, 5349, 49152-65535)${NC}"
elif command -v firewall-cmd &> /dev/null; then
  run_cmd firewall-cmd --permanent --add-port=80/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=443/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=3000/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=3001/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=3478/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=3478/udp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=5349/tcp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=5349/udp &>/dev/null || true
  run_cmd firewall-cmd --permanent --add-port=49152-65535/udp &>/dev/null || true
  run_cmd firewall-cmd --reload &>/dev/null || true
  echo -e "      ${GREEN}✓ Firewalld rules applied.${NC}"
fi

# ------------------------------------------------------------------------------
# 9. Install Node Dependencies, Compile Bundle & Launch via PM2
# ------------------------------------------------------------------------------
echo -e "${CYAN}[9/9] Installing Dependencies & Compiling Production Bundle...${NC}"

# Run npm install with fallback
npm install --prefer-offline || npm install --legacy-peer-deps

# Build Vite SPA bundle
echo -e "      Compiling Vite frontend bundle..."
npm run build

# Start or restart PM2 background daemon
echo -e "      Starting KawduLive unified backend with PM2..."
pm2 delete kawdulive &>/dev/null || true
pm2 delete youngpapi-live &>/dev/null || true

# Start service with tsx in production mode
pm2 start "npx tsx backend/server.js" --name "kawdulive" --time --max-memory-restart 1G --env NODE_ENV=production

# Save PM2 process list and configure startup
pm2 save || true
if [ "$IS_ROOT" = true ]; then
  pm2 startup systemd -u root --hp /root &>/dev/null || true
else
  run_cmd env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME &>/dev/null || true
fi

echo -e "\n${GREEN}${BOLD}"
echo "=============================================================================="
echo "    🎉 KAWDU LIVE INSTALLATION & DEPLOYMENT COMPLETE!"
echo "=============================================================================="
echo -e "${NC}"
echo -e "  🌐 ${BOLD}Domain URL (HTTP Port 80):${NC}       http://${SERVER_DOMAIN}"
echo -e "  🔒 ${BOLD}Secure Domain URL (HTTPS 443):${NC}    https://${SERVER_DOMAIN}"
echo -e "  🔗 ${BOLD}Direct Web App URL (Port 3000):${NC}  http://${SERVER_DOMAIN}:3000"
echo -e "  🛡️  ${BOLD}Dedicated Admin Portal:${NC}           http://${SERVER_DOMAIN}:3001"
echo -e "  📡 ${BOLD}CoTURN STUN / TURN Relay:${NC}         turn:${SERVER_DOMAIN}:3478"
echo -e "  🖥️  ${BOLD}Server IP Address:${NC}                ${SERVER_IP}"
echo -e "  📜 ${BOLD}Active SSL Certificate:${NC}          ${NGINX_SSL_CERT}"
echo -e ""
echo -e "  ${BOLD}Essential Commands:${NC}"
echo -e "    - View live streaming logs:    ${CYAN}pm2 logs kawdulive${NC}"
echo -e "    - Restart platform service:    ${CYAN}pm2 restart kawdulive${NC}"
echo -e "    - Check system health:         ${CYAN}pm2 status${NC}"
echo -e "    - Test Nginx configuration:    ${CYAN}sudo nginx -t${NC}"
echo -e "=============================================================================="
