# -*- coding: utf-8 -*-
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

HOST = "79.108.161.55"
USER = "root"
PASS = "UpGradeMyBusiness$$1980"

def run(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    result = (out + "\n" + err).strip()
    if result: print(f"    {result[:600]}")
    return result

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!")

print("\n[Check DNS from server]")
run(ssh, "dig +short voxkralex.ro @1.1.1.1")
run(ssh, "dig +short voxkralex.ro @8.8.8.8")

print("\n[Test HTTP access via domain]")
run(ssh, "curl -s -o /dev/null -w 'HTTP %{http_code}' http://voxkralex.ro/visio/ --max-time 10 2>&1", timeout=30)

print("\n[Running certbot for SSL...]")
result = run(ssh,
    "certbot --nginx -d voxkralex.ro -d www.voxkralex.ro "
    "--non-interactive --agree-tos --email ak@kralex.ro "
    "--redirect 2>&1",
    timeout=180
)

if "Congratulations" in result or "Certificate not yet due" in result or "certificate" in result.lower():
    print("\n[SSL SUCCESS]")
    run(ssh, "systemctl reload nginx")
    run(ssh, "curl -s -o /dev/null -w 'HTTPS %{http_code}' https://voxkralex.ro/visio/ --max-time 15 2>&1", timeout=30)
elif "DNS problem" in result or "No valid" in result or "Failed" in result:
    print("\n[DNS not propagated yet — try again in 10-15 min]")
else:
    print(f"\n[Result: {result[:200]}]")

print("\n[nginx status]")
run(ssh, "systemctl is-active nginx")

ssh.close()
print("\nDone.")
