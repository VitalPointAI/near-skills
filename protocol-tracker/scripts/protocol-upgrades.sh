#!/bin/bash
# Fetch nearcore releases from GitHub
# Usage: ./protocol-upgrades.sh [count]

set -e

COUNT="${1:-10}"

curl -s "https://api.github.com/repos/near/nearcore/releases?per_page=$COUNT" \
| jq '[.[] | {
    tag: .tag_name,
    name: .name,
    published: .published_at,
    prerelease: .prerelease,
    draft: .draft,
    url: .html_url,
    body_preview: (.body | split("\n")[0:5] | join("\n") | if length > 300 then .[0:300] + "..." else . end)
}]'
