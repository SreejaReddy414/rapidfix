#!/bin/sh

SPLUNK_HEC_URL="https://splunk:8088/services/collector/event"
SPLUNK_TOKEN="c4e5c9b8-d5a2-41b7-8f05-45c4fe6834d4"

echo "Installing curl..."
apk add --no-cache curl

echo "Waiting for log files..."
sleep 30

forward() {
    local app=$1
    local file=$2
    echo "Forwarding $app logs from $file"
    tail -F "$file" 2>/dev/null | while IFS= read -r line; do
        # Write line to temp file to avoid quoting issues
        echo "$line" > /tmp/logline.txt
        # Build JSON payload using the file
        printf '{"source":"%s","sourcetype":"java_app","index":"main","event":%s}' \
            "$app" "$(cat /tmp/logline.txt)" > /tmp/payload.txt
        # Send to Splunk
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