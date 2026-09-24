---
name: GitHub gitlink replacement
description: Replacing an orphaned Git submodule entry with a real application tree through the GitHub REST Git database API.
---

When replacing a submodule/gitlink in a GitHub tree commit, include a deletion entry for the old path with mode `160000`, type `commit`, and a null SHA before adding the new nested files.

**Why:** GitHub rejects a tree update when the gitlink deletion entry has no valid Git mode, even if the new nested files are otherwise valid.

**How to apply:** Read the current branch ref and commit tree, create any binary blobs first, create one replacement tree from the current root, commit it with the current head as parent, and update the branch without force-pushing.

When a Replit workspace has its own scaffold history but `origin` points to an existing GitHub repository, the branches can be unrelated even when the remote is reachable. Back up the local branch, then merge with `--allow-unrelated-histories` rather than force-resetting the workspace.

**Why:** A force reset can remove the active Replit artifact while a normal pull fails before it can reconcile the two histories.

**How to apply:** Preserve a local backup branch, merge the remote history, inspect the resulting pending push, and do not push the merge automatically if it would add generated workspace files to the user's repository.

For this workspace, GitHub HTTPS pushes do not have a usable password credential; authorized GitHub API writes are the reliable delivery path. The integration proxy is rate-limited to 10 requests per second.

**Why:** A normal `git push` fails with GitHub's password-authentication error, and an unpaced blob upload can be throttled even when OAuth access is valid.

**How to apply:** Never request or use a GitHub password/token from chat. Use the authorized integration, pace blob uploads, move the branch once, fetch the result, and reset the local branch only after verifying the remote tree.