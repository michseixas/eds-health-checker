#!/usr/bin/env python3
"""
Stop hook: enhanced macOS notification with session duration + token usage.
Reads the Claude Code hook JSON from stdin, parses the session transcript,
and fires an osascript notification.
"""
import sys
import json
import subprocess
from datetime import datetime

data = json.load(sys.stdin)
transcript_path = data.get("transcript_path", "")

duration_str = "unknown"
tokens_str = ""

if transcript_path:
    try:
        seen_uuids = set()
        total_output = 0
        timestamps = []

        with open(transcript_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except Exception:
                    continue

                ts = entry.get("timestamp")
                if ts:
                    timestamps.append(ts)

                uid = entry.get("uuid")
                usage = entry.get("message", {}).get("usage")
                if usage and uid and uid not in seen_uuids:
                    seen_uuids.add(uid)
                    total_output += usage.get("output_tokens", 0)

        if timestamps:
            fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
            start = datetime.strptime(min(timestamps), fmt)
            end = datetime.strptime(max(timestamps), fmt)
            secs = int((end - start).total_seconds())
            duration_str = f"{secs // 60}m {secs % 60}s" if secs >= 60 else f"{secs}s"

        if total_output:
            tokens_str = f"{total_output:,} tokens out"

    except Exception:
        pass

subtitle = duration_str
message = tokens_str or "Session complete"

subprocess.run(
    ["osascript", "-e", f'display notification "{message}" with title "Claude Code" subtitle "{subtitle}"'],
    capture_output=True,
)
