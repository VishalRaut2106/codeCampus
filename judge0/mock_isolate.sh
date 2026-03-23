#!/bin/bash
# Advanced mock isolate for WSL2 workaround
# Correctly passes stdout/stderr back to Judge0 for capture
LOG_FILE="/tmp/isolate_diag.log"
echo "[$(date)] isolate $@" >> "$LOG_FILE"

BOX_ID="0"
METADATA_FILE=""

# Parse arguments
args=("$@")
for ((i=0; i<${#args[@]}; i++)); do
  if [[ "${args[i]}" == "-b" ]] || [[ "${args[i]}" == "--box-id" ]]; then
    BOX_ID="${args[i+1]}"
  fi
  if [[ "${args[i]}" == "-M" ]] || [[ "${args[i]}" == "--metadata" ]]; then
    METADATA_FILE="${args[i+1]}"
  fi
  # Capture environment variables
  if [[ "${args[i]}" == "-E" ]]; then
    export "${args[i+1]}"
  fi
done

MOCK_ROOT="/tmp/judge0-mock"
BOX_ROOT="$MOCK_ROOT/box-$BOX_ID"

# Handle --init
if [[ "$*" == *"--init"* ]]; then
  mkdir -p "$BOX_ROOT/box"
  mkdir -p "$BOX_ROOT/tmp"
  chmod -R 777 "$MOCK_ROOT"
  echo "$BOX_ROOT"
  exit 0
fi

# Handle --run
if [[ "$*" == *"--run"* ]]; then
  # Find the command after --
  command_start=false
  RAW_CMD=""
  for arg in "$@"; do
    if [[ "$command_start" == "true" ]]; then
      # Properly escape the argument to build a safe command string
      RAW_CMD="$RAW_CMD $(printf '%q' "$arg")"
    elif [[ "$arg" == "--" ]]; then
      command_start=true
    fi
  done
  
  if [[ -z "$RAW_CMD" ]]; then
    exit 0
  fi

  mkdir -p "$BOX_ROOT/box"
  cd "$BOX_ROOT/box" || exit 1
  
  echo "Executing: $RAW_CMD" >> "$LOG_FILE"
  
  # Run the command. If --stderr-to-stdout is set, we merge outputs.
  # We MUST NOT redirect stdout/stderr to LOG_FILE here, because Judge0 captures them from our stdout/stderr.
  if [[ "$*" == *"--stderr-to-stdout"* ]]; then
    # Merge stderr to stdout so Judge0 captures everything
    eval "$RAW_CMD" 2>&1
    EXIT_CODE=$?
  else
    # Keep them separate so Judge0 handles them
    eval "$RAW_CMD"
    EXIT_CODE=$?
  fi
  
  echo "Exit Code: $EXIT_CODE" >> "$LOG_FILE"
  
  # Write metadata
  if [[ -n "$METADATA_FILE" ]]; then
    mkdir -p "$(dirname "$METADATA_FILE")"
    echo "exitcode:$EXIT_CODE" > "$METADATA_FILE"
    echo "time:0.05" >> "$METADATA_FILE"
    echo "time-wall:0.05" >> "$METADATA_FILE"
    echo "max-rss:1024" >> "$METADATA_FILE"
    if [[ $EXIT_CODE -ne 0 ]]; then
        echo "status:RE" >> "$METADATA_FILE"
        echo "message:Command failed with exit code $EXIT_CODE" >> "$METADATA_FILE"
    fi
  fi
  
  exit $EXIT_CODE
fi

# Handle --cleanup
if [[ "$*" == *"--cleanup"* ]]; then
  rm -rf "$BOX_ROOT"
  exit 0
fi

exit 0
