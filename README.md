# Zone Defense

Zone Defense is an application to help you choose the correct firewall zone for wireless connections. When you connect to a new network, Zone Defense will open a window prompting you for what kind of network (eg home, public, work) it is. When you choose the network type, it is associated with that network and automatically used in the future.

[NetworkManager](https://networkmanager.dev/) and [firewalld](https://firewalld.org/) are required. If you don't use those, you can't use Zone Defense. Fedora uses both by default. Other distributions may not.

Additional setup is required after installation. See the correct section for your distribution.

## How It Works

Did you know that NetworkManager has a feature to automatically change your firewall zone based on the connection? This allows you to do things like block incoming ssh connections when you're using the coffee shop WiFi. Unfortunately, this feature sits largely undiscovered. Zone Defense brings GUI discoverability to it. 

Zone Defense is an integration between NetworkManager and firewalld using [D-Bus](https://www.freedesktop.org/wiki/Software/dbus/). At a high level, it does the following:

1. Listen for D-Bus signals from NetworkManager that a Wi-Fi device has changed to a new connection.
2. If the connection has already been seen and configured, nothing happens. But if it hasn't, we continue.
3. Use D-Bus to prompt firewalld for a list of zones. This generally large list is pared down to a few basics.
4. A window opens to explain what is happening, allowing the user to choose a firewall zone for the network.
5. If the user clicks Exit, or closes the window, no changes are made. If the user chooses a zone, we continue.
6. Use D-Bus to set the connection zone in NetworkManager. NetworkManager will automatically change the firewall zone to this value on subsequent connections to this network.

## Installation

Install from Flathub (pending).

## Setup

Unlike most Flatpak applications, Zone Defense needs to start when you log in. So you'll need to configure autostart.

Because Zone Defense requires NetworkManager and firewalld, and changing firewall zones sometimes requires root (depending on polkit configuration), there may be additional setup required. The table below shows relevant information for various distributions.

| Distribution | NetworkManager<br/>by default | firewalld<br/>by default | polkit OK for<br/>admin users<br/>by default | polkit OK for<br/>regular users<br/>by default |
| ------------ | ----------------------------- | ------------------------ | -------------------------------------------- | ---------------------------------------------- |
| Fedora 41    | &check;                       | &check;                  | &check;                                      | &check;                                        |
| Ubuntu 24.10 | &check;                       | &cross;                  | &check;                                      | &cross;                                        |
| Debian 12    | &check;                       | &cross;                  | &check;                                      | &check;                                        |

### Fedora

For Fedora, everything just works! Though you still have to set up autostart.

1. Set up autostart by doing 1 of the following:
    - For system-wide autostart, copy the `.desktop` file to `$XDG_CONFIG_DIRS/autostart`. (eg `sudo cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop /etc/xdg/autostart/`)
    - For user-specific autostart, copy the `.desktop` file to `$XDG_CONFIG_HOME/autostart`. (eg `mkdir $HOME/.config/autostart && cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop $HOME/.config/autostart/`)

### Ubuntu

1. Uninstall ufw: `sudo apt remove ufw`
2. Install firewalld: `sudo apt install firewalld`
3. By default, polkit is configured to not let regular users set the zone for a connection. The simplest way to change this is to add users to the `netdev` group (eg `usermod -a -G netdev justin`). Alternatively, you can create a custom polkit rule for the `org.freedesktop.NetworkManager.settings.modify.system` action (how to create custom polkit rules is beyond the scope of this document and is left as an exercise for the reader).
4. Set up autostart by doing 1 of the following:
    - For system-wide autostart, copy the `.desktop` file to `$XDG_CONFIG_DIRS/autostart`. (eg `sudo cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop /etc/xdg/autostart/`)
    - For user-specific autostart, copy the `.desktop` file to `$XDG_CONFIG_HOME/autostart`. (eg `mkdir $HOME/.config/autostart && cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop $HOME/.config/autostart/`)

### Debian

1. Install firewalld: `sudo apt install firewalld`
2. By default, polkit is configured to not let regular users set the zone for a connection. The simplest way to change this is to add users to the `netdev` group (eg `usermod -a -G netdev justin`). Alternatively, you can create a custom polkit rule for the `org.freedesktop.NetworkManager.settings.modify.system` action (how to create custom polkit rules is beyond the scope of this document and is left as an exercise for the reader).
3. Set up autostart by doing 1 of the following:
    - For system-wide autostart, copy the `.desktop` file to `$XDG_CONFIG_DIRS/autostart`. (eg `sudo cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop /etc/xdg/autostart/`)
    - For user-specific autostart, copy the `.desktop` file to `$XDG_CONFIG_HOME/autostart`. (eg `mkdir $HOME/.config/autostart && cp /var/lib/flatpak/exports/share/applications/com.github.justinrdonnelly.ZoneDefense.desktop $HOME/.config/autostart/`)

## License

Zone Defense is distributed under the terms of the Mozilla Public License, version 2.
