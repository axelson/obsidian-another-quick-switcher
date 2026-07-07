# CLAUDE

## Commands

- Test: `bun run test`
- Lint: `bun run lint`
- Type check: `bun run typecheck`
- Build: `bun run build`

## Development workflow

1. Review the existing code and make a plan
2. Once the plan is approved, implement it
3. After making a round of file changes, run `bun run pre:push`
    - If it fails, go back to step 2 and fix
4. Ask the user to verify the behavior
5. If step 4 is OK, update the README
6. Commit

## Development priorities

- **Prioritize performance**
    - Assume the vault has tens of thousands of notes
    - If computational cost increases, present numbers showing how much speed changes before and after
- **If a change carries regression risk and has no tests, add *minimal* unit tests**

## Commit messages

Write in English.

- Describe what changes for the user (the change in experience, not implementation details)
- State the outcome, like "add ~", "fix ~", "change to ~"
- Implementation-perspective descriptions are only OK for internal refactoring

@FORK.md
