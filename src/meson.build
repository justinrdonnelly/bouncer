pkgdatadir = get_option('datadir') / meson.project_name()
gnome = import('gnome')

app_conf = configuration_data()
app_conf.set('app_id', app_id)
app_conf.set('version', version)
app_conf_created = configure_file(
  configuration: app_conf,
  input: 'config.js.in',
  output: 'config.js',
)

src_res = gnome.compile_resources(
  'io.github.justinrdonnelly.bouncer.src',
  'io.github.justinrdonnelly.bouncer.src.gresource.xml',
  dependencies: [app_conf_created],
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_res = gnome.compile_resources(
  'io.github.justinrdonnelly.bouncer.data',
  'io.github.justinrdonnelly.bouncer.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', get_option('prefix') / get_option('libdir'))
bin_conf.set('datadir', get_option('prefix') / get_option('datadir'))
bin_conf.set('resource_path', '/io/github/justinrdonnelly/bouncer')

configure_file(
  input: 'io.github.justinrdonnelly.bouncer.in',
  output: 'io.github.justinrdonnelly.bouncer',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir')
)
