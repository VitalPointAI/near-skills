#!/bin/bash
# Fetch NEP proposals from GitHub
# Usage: ./nep-status.sh [status-filter]
# Status filters: approved, draft, review, living, withdrawn, etc.

set -e

STATUS_FILTER="${1:-}"

# Fetch NEP files from the repo (only .md files in neps/ directory)
fetch_neps() {
    curl -s "https://api.github.com/repos/near/NEPs/contents/neps" \
    | jq -r '.[] | select(.type == "file") | select(.name | endswith(".md")) | .download_url' \
    | while read -r url; do
        if [ -n "$url" ] && [ "$url" != "null" ]; then
            # Fetch the file and extract frontmatter (first 50 lines should be enough)
            CONTENT=$(curl -s "$url" | head -50)
            
            # Extract NEP number
            NEP_NUM=$(echo "$CONTENT" | grep -iE '^NEP:' | head -1 | sed 's/^[Nn][Ee][Pp]:[[:space:]]*//')
            
            # Extract title
            TITLE=$(echo "$CONTENT" | grep -iE '^Title:' | head -1 | sed 's/^[Tt]itle:[[:space:]]*//' | tr -d '"' | sed "s/'/\\\\'/g")
            
            # Extract status
            STATUS=$(echo "$CONTENT" | grep -iE '^Status:' | head -1 | sed 's/^[Ss]tatus:[[:space:]]*//' | tr -d '"' | tr '[:upper:]' '[:lower:]')
            
            # Extract type
            TYPE=$(echo "$CONTENT" | grep -iE '^Type:' | head -1 | sed 's/^[Tt]ype:[[:space:]]*//' | tr -d '"')
            
            # Extract created date
            CREATED=$(echo "$CONTENT" | grep -iE '^Created:' | head -1 | sed 's/^[Cc]reated:[[:space:]]*//' | tr -d '"')
            
            if [ -n "$NEP_NUM" ]; then
                # Escape any remaining problematic chars in title
                SAFE_TITLE=$(echo "$TITLE" | sed 's/"/\\"/g')
                printf '{"nep":%s,"title":"%s","status":"%s","type":"%s","created":"%s"}\n' \
                    "$NEP_NUM" "$SAFE_TITLE" "$STATUS" "$TYPE" "$CREATED"
            fi
        fi
    done
}

# Get all NEPs
ALL_NEPS=$(fetch_neps | jq -s '.' 2>/dev/null || echo "[]")

if [ -n "$STATUS_FILTER" ]; then
    echo "$ALL_NEPS" | jq --arg status "$STATUS_FILTER" '[.[] | select(.status == $status)] | sort_by(.nep)'
else
    echo "$ALL_NEPS" | jq 'sort_by(.nep)'
fi
