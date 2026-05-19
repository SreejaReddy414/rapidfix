#!/bin/sh
curl -sk -X POST https://splunk:8088/services/collector/event \
  -H "Authorization: Splunk c4e5c9b8-d5a2-41b7-8f05-45c4fe6834d4" \
  -H "Content-Type: application/json" \
  -d '{"event":"test from forwarder","source":"user-service"}'