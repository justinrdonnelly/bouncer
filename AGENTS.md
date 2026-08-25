# Bouncer Agent Guidance

## GNOME UI Guidance

When evaluating, proposing, implementing, or reviewing UI changes:

- Treat the current GNOME Human Interface Guidelines as the primary normative
  source and give it precedence over application examples.
- Inspect current, maintained GNOME Core and GNOME Circle applications for
  structurally comparable examples of how GNOME design guidance is applied in
  practice.
- Prefer source code and current screenshots over remembered conventions.
- Distinguish explicit HIG guidance from patterns merely observed in apps;
  Circle membership does not make every individual design choice canonical.
- Cite the relevant HIG guidance and application examples when explaining a
  recommendation.

## Project Stack

- Bouncer is a GJS ES-module application using GTK 4, libadwaita, Meson,
  gettext, and Flatpak.
- Runtime code uses GJS and GObject Introspection APIs. Do not introduce
  Node.js or browser-only APIs into `src/`.
- NPM dependencies are development tools only. Application runtime
  dependencies must be available through GJS, the GNOME Flatpak runtime, or an
  explicitly added Flatpak module.
- Follow the existing `GObject.registerClass`, GtkBuilder template, GObject
  property, signal, and binding patterns.
- Prefer module-level functions for stateless helpers. Use classes when state,
  lifecycle, inheritance, properties, or signals justify them.
- In JavaScript imports, explicitly select GTK/GDK 4.0 and Adw 1. In
  GtkBuilder files, require GTK 4.0 and do not add an Adw requirement.

## Resources And Translations

- Add or rename runtime JavaScript and UI files in the corresponding
  `src/*.gresource.xml` manifest.
- Keep `po/POTFILES.in` synchronized with files containing gettext-marked
  JavaScript strings or translatable UI and metadata content.
- When regenerating `po/bouncer.pot`, use
  `meson compile -C build bouncer-pot`.
- Do not invoke `xgettext` directly or update translation catalogs unless the
  task calls for it.

## Release Metadata

- During development, the first `<release>` in
  `data/io.github.justinrdonnelly.bouncer.metainfo.xml.in.in` may be a
  placeholder for the next release.
- Empty `version` and `date` attributes on that placeholder are intentional.
  Do not populate them or report them as errors unless preparing a release.
- Add relevant user-facing changes to the placeholder release's
  `<description><ul>` as concise `<li>` entries.

## Verification

- Run `npx eslint .` after JavaScript changes.
- If the build directory does not exist, configure it with
  `meson setup build`. Then run `meson compile -C build`.
- Run `meson test -C build` for desktop file, AppStream metadata, and
  GSettings schema validation.
- Prettier is not a required formatter or verification step. Do not run it
  routinely.
- Prettier may be run selectively on new files or files with substantial new
  code as a source of suggestions. Do not retain its output wholesale;
  evaluate each change against the existing project style.
- The scripts under `test/` are manual smoke tests and may modify the host
  system. Inspect them and obtain approval before running them.

## Safety And Workflow

- Bouncer interacts with NetworkManager and firewalld over the system bus. Do
  not modify live network, firewall, polkit, or autostart configuration without
  explicit approval.
- Treat Flatpak permissions in `finish-args` as security-sensitive. Do not
  broaden them without explaining and reviewing the requirement.
- Do not stage, commit, amend, rebase, or otherwise rewrite Git history unless
  explicitly requested.
