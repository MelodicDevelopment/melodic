# Commit and Push

Commit all staged and unstaged changes with a well-written, descriptive commit message, then push to the remote repository.

## Instructions

1. Run `git status` to see all changes (do not use `-uall` flag)
2. Run `git diff` to review the actual changes
3. Run `git log --oneline -5` to see recent commit message style
4. Analyze all changes and write a descriptive commit message that:
   - Summarizes the nature of the changes (feature, fix, refactor, etc.)
   - Uses imperative mood ("Add feature" not "Added feature")
   - Includes a brief body with bullet points if multiple changes
   - Does NOT include a Co-Authored-By line
5. Stage all relevant changes with `git add`
6. Commit with the message using a HEREDOC format
7. Push to the remote with `git push`
8. Report the commit hash and summary when complete
