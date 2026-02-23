# Publish Components

Build and publish the `@melodicdev/components` package to npm.

## Instructions

1. Read `packages/melodic-components/package.json` to get the current version
2. Ask the user what kind of release this is: **patch** (bug fix), **minor** (new feature), or **major** (breaking change)
3. Increment the version in `packages/melodic-components/package.json` accordingly:
   - patch: z in x.y.z → x.y.(z+1)
   - minor: y in x.y.z → x.(y+1).0
   - major: x in x.y.z → (x+1).0.0
4. Run `npm publish --access public` in `packages/melodic-components/` (the `prepublishOnly` script runs the build automatically)
5. If publish succeeds, commit the version bump with message: `Bump @melodicdev/components to <version>`
6. Report the published version and any output from the publish step

## Notes

- Do not add a `Co-Authored-By` line to the commit
- The build runs automatically via `prepublishOnly` — do not run it separately
- If the build fails, report the errors and do not publish
