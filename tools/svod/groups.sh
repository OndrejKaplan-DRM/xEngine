#!/bin/bash
# Testy po skupinách na aktuální větvi; $1 = štítek
cd /home/claude/xengine
L=/home/claude/log
echo "START $1 $(date +%H:%M:%S) $(git rev-parse --short HEAD)" > $L/g_$1_status.txt
for g in "test" "run test:a" "run test:b" "run test:axb"; do
  S=$(date +%s); npm $g > $L/g_$1_${g// /_}.log 2>&1; echo "npm $g exit $? za $(( $(date +%s)-S )) s" >> $L/g_$1_status.txt
done
echo "KONEC $(date +%H:%M:%S)" >> $L/g_$1_status.txt
