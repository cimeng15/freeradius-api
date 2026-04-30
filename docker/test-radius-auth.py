#!/usr/bin/env python3
"""Test RADIUS authentication from host (simulating Mikrotik)"""
import socket, struct, hashlib, os, sys

host = '127.0.0.1'
port = 1812
secret = b'radius123'
username = b'ilmi'
password = b'ilmi1515'

print(f"Testing RADIUS auth: user={username.decode()}, server={host}:{port}, secret={secret.decode()}")
print(f"Simulating NAS-IP: 192.168.111.50")
print()

# Build RADIUS Access-Request packet
code = 1  # Access-Request
identifier = 99
authenticator = os.urandom(16)

# User-Name attribute (type=1)
user_attr = struct.pack('BB', 1, len(username)+2) + username

# User-Password (PAP encoded)
pwd_padded = password + b'\x00' * (16 - len(password) % 16)
md5_input = secret + authenticator
pwd_encrypted = b''
for i in range(0, len(pwd_padded), 16):
    block = hashlib.md5(md5_input).digest()
    chunk = bytes(a ^ b for a, b in zip(pwd_padded[i:i+16], block))
    pwd_encrypted += chunk
    md5_input = secret + chunk
pwd_attr = struct.pack('BB', 2, len(pwd_encrypted)+2) + pwd_encrypted

# NAS-IP-Address (type=4)
nas_ip = socket.inet_aton('192.168.111.50')
nas_attr = struct.pack('BB', 4, 6) + nas_ip

# Assemble packet
attrs = user_attr + pwd_attr + nas_attr
length = 20 + len(attrs)
packet = struct.pack('!BBH', code, identifier, length) + authenticator + attrs

# Send
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(5)
sock.sendto(packet, (host, port))

try:
    data, addr = sock.recvfrom(4096)
    resp_code = data[0]
    if resp_code == 2:
        print("✅ Access-Accept! Authentication successful!")
        print("   FreeRADIUS accepted user 'ilmi' with secret 'radius123'")
        print("   Mikrotik should work with same settings.")
    elif resp_code == 3:
        print("❌ Access-Reject - wrong username/password")
    else:
        print(f"⚠️  Unknown response code: {resp_code}")
except socket.timeout:
    print("❌ TIMEOUT - FreeRADIUS did not respond!")
    print("   Possible causes:")
    print("   - FreeRADIUS container not running")
    print("   - Secret mismatch (client not recognized)")
    print("   - Firewall blocking UDP 1812")
finally:
    sock.close()
