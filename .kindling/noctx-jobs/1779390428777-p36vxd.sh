#!/usr/bin/env bash
set +e
exec > "/Users/justin/.kindling/run/worktrees/integration-l4-1779390404300/.kindling/noctx-jobs/1779390428777-p36vxd.stdout.log" 2> "/Users/justin/.kindling/run/worktrees/integration-l4-1779390404300/.kindling/noctx-jobs/1779390428777-p36vxd.stderr.log"
true # noop (next mode)
code=$?
printf 'exitCode=%s\nfinishedAt=%s\n' "$code" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "/Users/justin/.kindling/run/worktrees/integration-l4-1779390404300/.kindling/noctx-jobs/1779390428777-p36vxd.status"
exit $code
