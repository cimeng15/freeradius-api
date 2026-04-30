# 4. Konfigurasi Mikrotik

## Quick Setup

Paste di terminal Mikrotik (ganti IP_SERVER dengan IP server Anda):

```routeros
/radius add address=IP_SERVER secret=radius123 service=ppp,hotspot
/ppp aaa set use-radius=yes accounting=yes
/ip pool add name=pppoe-pool ranges=10.10.10.2-10.10.10.254
/ppp profile add name=radius-profile local-address=10.10.10.1 remote-address=pppoe-pool dns-server=8.8.8.8
/interface pppoe-server server add service-name=PPPoE interface=ether2 default-profile=radius-profile disabled=no
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade
```

## Verifikasi

```routeros
/radius print                    # Cek RADIUS server
/ping IP_SERVER count=3          # Test koneksi
/ppp active print                # Lihat client aktif
/log print where topics~"radius" # Log RADIUS
```

## Hotspot Setup

```routeros
/ip pool add name=hotspot-pool ranges=10.20.20.2-10.20.20.254
/ip hotspot profile set default use-radius=yes accounting=yes
/ip hotspot add name=hotspot1 interface=ether3 address-pool=hotspot-pool disabled=no
```

## Development (Mac)

Di Mac, jalankan forwarder sebelum test:
```bash
./docker/radius-forward.sh
```

Di production (Linux), tidak perlu forwarder.
