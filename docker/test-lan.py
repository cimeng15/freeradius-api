#!/usr/bin/env python3
"""Test RADIUS from LAN IP (simulating Mikrotik)"""
import socket, struct, hashlib, os

host = '192.168.111.105'
port = 1812
secret = b'radius123'
username = b'ilmi'
password = b'ilmi1515'

print(f"Testing {host}:{port} with secret=radius123, user=ilmi")

code = 1
identifier = 42
authenticator = os.urandom(16)
user_attr = struct.pack('BB', 1, len(username)+2) + username
pwd_padded = password + b'\x00' * (16 - len(password) % 16)
md5_input = secret + authenticator
pwd_encrypted = b''
for i in range(0, len(pwd_padded), 16):
    block = hashlib.md5(md5_input).digest()
    chunk = bytes(a ^ b for a, b in zip(pwd_padded[i:i+16], block))
    pwd_encrypted += chunk
    md5_input = secret + chunk
pwd_attr = struct.pack('BB', 2, len(pwd_encrypted)+2) + pwd_encrypted
nas_ip = socket.inet_aton('192.168.111.1')
nas_attr = struct.pack('BB', 4, 6) + nas_ip
attrs = user_attr + pwd_attr + nas_attr
length = 20 + len(attrs)
packet = struct.pack('!BBH', code, identifier, length) + authenticator + attrs

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(5)
sock.sendto(packet, (host, port))
try:
    data, addr = sock.recvfrom(4096)
    if data[0] == 2:
        print(f"✅ Access-Accept! LAN IP {host}:1812 is working!")
    elif data[0] == 3:
        print(f"❌ Access-Reject")
    else:
        print(f"Response code: {data[0]}")
except socket.timeout:
    print(f"❌ TIMEOUT - {host}:1812 not reachable")
sock.close()
