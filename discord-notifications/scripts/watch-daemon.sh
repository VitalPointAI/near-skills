#!/bin/bash
# NEAR Watch Daemon
# Runs the monitor in a loop with configurable interval

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${HOME}/.openclaw/near-discord/watch.pid"
LOG_FILE="${HOME}/.openclaw/near-discord/watch.log"

# Default interval in seconds
DEFAULT_INTERVAL=60

start_daemon() {
    local interval="${1:-$DEFAULT_INTERVAL}"
    local account="$2"
    
    mkdir -p "$(dirname "$PID_FILE")"
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Watch daemon already running (PID: $pid)"
            return 1
        fi
    fi
    
    echo "Starting NEAR watch daemon (interval: ${interval}s)..."
    
    (
        while true; do
            if [[ -n "$account" ]]; then
                "$SCRIPT_DIR/near-monitor.sh" --account "$account" >> "$LOG_FILE" 2>&1
            else
                "$SCRIPT_DIR/near-monitor.sh" --all >> "$LOG_FILE" 2>&1
            fi
            sleep "$interval"
        done
    ) &
    
    echo $! > "$PID_FILE"
    echo "Watch daemon started (PID: $!)"
    echo "Logs: $LOG_FILE"
}

stop_daemon() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$PID_FILE"
            echo "Watch daemon stopped (PID: $pid)"
        else
            rm -f "$PID_FILE"
            echo "Watch daemon not running (stale PID file removed)"
        fi
    else
        echo "Watch daemon not running"
    fi
}

status_daemon() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Watch daemon running (PID: $pid)"
            echo "Log file: $LOG_FILE"
            echo ""
            echo "Last 10 log entries:"
            tail -10 "$LOG_FILE" 2>/dev/null || echo "(no logs yet)"
        else
            echo "Watch daemon not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        echo "Watch daemon not running"
    fi
}

# Parse arguments
interval=$DEFAULT_INTERVAL
account=""
background=false
action="run"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --interval)
            interval="$2"
            shift 2
            ;;
        --account)
            account="$2"
            shift 2
            ;;
        --background)
            background=true
            shift
            ;;
        --stop)
            action="stop"
            shift
            ;;
        --status)
            action="status"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

case "$action" in
    run)
        if [[ "$background" == "true" ]]; then
            start_daemon "$interval" "$account"
        else
            echo "Starting NEAR watch (interval: ${interval}s, Ctrl+C to stop)..."
            while true; do
                if [[ -n "$account" ]]; then
                    "$SCRIPT_DIR/near-monitor.sh" --account "$account"
                else
                    "$SCRIPT_DIR/near-monitor.sh" --all
                fi
                sleep "$interval"
            done
        fi
        ;;
    stop)
        stop_daemon
        ;;
    status)
        status_daemon
        ;;
esac
