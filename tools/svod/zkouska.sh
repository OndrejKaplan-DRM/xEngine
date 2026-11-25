#!/bin/bash
# Sloučení nanečisto main + origin/sesna-a + origin/sesna-b na dočasné větvi, testy po skupinách, úklid.
cd /home/claude/xengine
L=/home/claude/log
git fetch -q --depth=300 origin sesna-a sesna-b 2>/dev/null
echo "START $(date +%H:%M:%S) main=$(git rev-parse --short main) A=$(git rev-parse --short origin/sesna-a) B=$(git rev-parse --short origin/sesna-b)" > $L/z_status.txt
git checkout -q -B zkouska main
git merge -q --no-ff --no-edit origin/sesna-a > $L/z_merge_a.log 2>&1; echo "merge A exit $?" >> $L/z_status.txt
git diff --name-only --diff-filter=U | sed 's/^/  konflikt A: /' >> $L/z_status.txt
git merge -q --no-ff --no-edit origin/sesna-b > $L/z_merge_b.log 2>&1; echo "merge B exit $?" >> $L/z_status.txt
git diff --name-only --diff-filter=U | sed 's/^/  konflikt B: /' >> $L/z_status.txt
if [ -z "$(git diff --name-only --diff-filter=U)" ]; then
  npm install > $L/z_install.log 2>&1
  for g in "test" "run test:a" "run test:b" "run test:axb"; do
    S=$(date +%s); npm $g > $L/z_${g// /_}.log 2>&1; echo "npm $g exit $? za $(( $(date +%s)-S )) s" >> $L/z_status.txt
  done
fi
git merge --abort 2>/dev/null; git checkout -q -- . ; git checkout -q main; git branch -D zkouska > /dev/null
npm install > /dev/null 2>&1
echo "KONEC $(date +%H:%M:%S)" >> $L/z_status.txt
