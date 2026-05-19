#!/bin/sh

SPLUNK_HEC_URL="${SPLUNK_HEC_URL:-https://splunk:8088/services/collector/event}"
SPLUNK_TOKEN="${SPLUNK_HEC_TOKEN}"

if [ -z "$SPLUNK_TOKEN" ]; then
  echo "ERROR: SPLUNK_HEC_TOKEN is not set"
  exit 1
fi

echo "Installing curl..."
apk add --no-cache curl

echo "Waiting for log files..."
sleep 30

forward() {
    local app=$1
    local file=$2
    echo "Forwarding $app logs from $file"
    tail -F "$file" 2>/dev/null | while IFS= read -r line; do
        escaped=$(printf '%s' "$line" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"source":"%s","sourcetype":"java_app","index":"main","event":"%s"}' \
            "$app" "$escaped" > /tmp/payload.txt
        curl -sk -X POST "$SPLUNK_HEC_URL" \
            -H "Authorization: Splunk $SPLUNK_TOKEN" \
            -H "Content-Type: application/json" \
            --data-binary @/tmp/payload.txt \
            > /dev/null 2>&1
    done &
}

forward "user-service"       "/logs/user/user-service.log"
forward "technician-service" "/logs/technician/technician-service.log"
forward "dispatch-service"   "/logs/dispatch/dispatch-service.log"
forward "gateway"            "/logs/gateway/gateway.log"

echo "Log forwarder running..."
wait