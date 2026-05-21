#!/usr/bin/env bash
set +e
exec > "/Users/justin/.kindling/run/worktrees/integration-l4-1779388733674/.kindling/noctx-jobs/1779388916861-myc9bi.stdout.log" 2> "/Users/justin/.kindling/run/worktrees/integration-l4-1779388733674/.kindling/noctx-jobs/1779388916861-myc9bi.stderr.log"
true && echo 'noop'
code=$?
printf 'exitCode=%s\nfinishedAt=%s\n' "$code" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "/Users/justin/.kindling/run/worktrees/integration-l4-1779388733674/.kindling/noctx-jobs/1779388916861-myc9bi.status"
exit $code
