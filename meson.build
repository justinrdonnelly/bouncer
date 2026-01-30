project(
  'bouncer',
  version: '49.3.0',
  meson_version: '>= 1.9.0',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

i18n = import('i18n')
gnome = import('gnome')



app_id = 'io.github.justinrdonnelly.bouncer'
app_schema_path = '/io/github/justinrdonnelly/bouncer/'
version = meson.project_version()

subdir('data')
subdir('src')
subdir('po')

gnome.post_install(
  glib_compile_schemas: true,
  gtk_update_icon_cache: true,
  update_desktop_database: true,
)
