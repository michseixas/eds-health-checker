#!/usr/bin/env python3
import sys
import json
import subprocess
from datetime import datetime, timezone

data = json.load(sys.stdin)
transcript_path = data.get("transcript_path", "")
session_id = data.get("session_id", "unknown")
state_file = f"/tmp/claude-stop-{session_id}"

prev_stop = None
try:
    with open(state_file) as f:
        prev_stop = f.read().strip()
except FileNotFoundError:
    pass

now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
try:
    with open(state_file, "w") as f:
        f.write(now_str)
except Exception:
    pass

prev_dt = None
if prev_stop:
    try:
        prev_dt = datetime.strptime(prev_stop, "%Y-%m-%dT%H:%M:%S.%fZ")
    except Exception:
        pass

duration_str = "–"
total_output = 0

if transcript_path:
    try:
        seen_uuids = set()
        timestamps = []
        fmt = "%Y-%m-%dT%H:%M:%S.%fZ"

        with open(transcript_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except Exception:
                    continue

                ts = entry.get("timestamp", "")

                if prev_dt is not None:
                    try:
                        if datetime.strptime(ts, fmt) <= prev_dt:
                            continue
                    except Exception:
                        pass

                if ts:
                    timestamps.append(ts)

                uid = entry.get("uuid")
                usage = entry.get("message", {}).get("usage")
                if usage and uid and uid not in seen_uuids:
                    seen_uuids.add(uid)
                    total_output += usage.get("output_tokens", 0)

        if timestamps:
            start = datetime.strptime(min(timestamps), fmt)
            end = datetime.strptime(max(timestamps), fmt)
            secs = int((end - start).total_seconds())
            duration_str = f"{secs // 60}m {secs % 60}s" if secs >= 60 else f"{secs}s"

    except Exception:
        pass

message = f"{total_output:,} tokens out" if total_output else "done"

subprocess.run(
    ["osascript", "-e", f'display notification "{message}" with title "Claude Code" subtitle "{duration_str}"'],
    capture_output=True,
)