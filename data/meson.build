app_name = 'Bouncer'

desktop_config = configuration_data()
desktop_config.set('APP_ID', app_id)
desktop_config.set('APP_NAME', app_name)
desktop_file_in = configure_file(
  input: 'io.github.justinrdonnelly.bouncer.desktop.in.in',
  output: 'io.github.justinrdonnelly.bouncer.desktop.in',
  configuration: desktop_config
)
desktop_file = i18n.merge_file(
  input: desktop_file_in,
  output: '@0@.desktop'.format(app_id),
  type: 'desktop',
  po_dir: '../po',
  install: true,
  install_dir: get_option('datadir') / 'applications'
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils, args: [desktop_file])
endif

appstream_config = configuration_data()
appstream_config.set('APP_ID', app_id)
appstream_config.set('APP_NAME', app_name)
appstream_file_in = configure_file(
  input: 'io.github.justinrdonnelly.bouncer.metainfo.xml.in.in',
  output: 'io.github.justinrdonnelly.bouncer.metainfo.xml.in',
  configuration: appstream_config
)
appstream_file = i18n.merge_file(
  input: appstream_file_in,
  output: 'io.github.justinrdonnelly.bouncer.metainfo.xml',
  po_dir: '../po',
  install: true,
  install_dir: get_option('datadir') / 'metainfo'
)

appstreamcli = find_program('appstreamcli', required: false, disabler: true)
test(
  'Validate appstream file',
  appstreamcli,
  args: ['validate', '--no-net', '--explain', appstream_file]
)

gschema_config = configuration_data()
gschema_config.set('APP_ID', app_id)
gschema_config.set('APP_SCHEMA_PATH', app_schema_path)
gschema_file_in = configure_file(
  input: 'io.github.justinrdonnelly.bouncer.gschema.xml.in',
  output: 'io.github.justinrdonnelly.bouncer.gschema.xml',
  configuration: gschema_config
)

install_data(
  gschema_file_in,
  install_dir: get_option('datadir') / 'glib-2.0' / 'schemas'
)

compile_schemas = find_program('glib-compile-schemas', required: false, disabler: true)
test(
  'Validate schema file',
  compile_schemas,
  args: ['--strict', '--dry-run', meson.current_source_dir()]
)

subdir('icons')
