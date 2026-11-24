# Security Policy

## Supported versions

Security fixes are released for the current major version of each package.

| Package | Supported |
|---|---|
| `@melodicdev/core` | 4.x |
| `@melodicdev/components` | 4.x |
| `@melodicdev/cli` | 4.x |

Older majors do not receive fixes. No release within a major removes public API, but a
minor can include deliberate behaviour corrections; `MIGRATION.md` lists them per version
and `CHANGELOG.md` has the full detail.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub: on the
[repository's Security tab](https://github.com/MelodicDevelopment/melodic/security),
choose **Report a vulnerability**. That opens a private advisory visible only
to the maintainers.

Include, as far as you can:

- the package and version affected;
- what an attacker can do, and what they need in order to do it;
- a minimal reproduction (a template, a route config, a CLI invocation).

You should get an acknowledgement within a week. Once a fix is released, the
advisory is published and you are credited unless you ask not to be.

## What counts

Melodic runs in the browser and, for the CLI, on a developer's machine. The
areas where a bug is a security bug rather than an ordinary one:

- **Template rendering.** Interpolated values (`${value}`, attribute and
  property bindings) are written as text nodes or via `setAttribute` and never
  reach the HTML parser. Anything that lets an interpolated *value* be parsed
  as markup or executed is a vulnerability. `unsafeHTML()` is the documented
  exception: it renders its argument as HTML by design, and passing it
  untrusted input is an application bug, not a framework one.
- **Routing.** Guards being skipped, or a redirect target that can be steered
  to another origin.
- **HTTP client.** Credentials or headers sent to an origin other than the one
  the request was configured for.
- **CLI.** Writing outside the project directory, or generated code that
  executes input passed on the command line. Names are validated against
  `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, and `generate --path` and `add app|lib --dir`
  must stay inside the project, including through symlinks. (`add config|testing
  --path` names the project directory to operate on, as `init <dir>` does.) The CLI never runs shell commands.
- **Published packages.** Anything in a published tarball that should not be
  there.

## Dependencies

All three packages have **no runtime dependencies**, so installing them adds
nothing else to a production dependency tree (`npm audit --omit=dev` reports
zero). Build and test tooling is kept current by Dependabot
(`.github/dependabot.yml`).
