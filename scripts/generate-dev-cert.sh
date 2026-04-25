#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="${ROOT_DIR}/.cert"
KEY_FILE="${CERT_DIR}/dev.key"
CERT_FILE="${CERT_DIR}/dev.crt"
HOSTS_RAW="${1:-localhost,127.0.0.1}"

mkdir -p "${CERT_DIR}"

IFS=',' read -r -a HOSTS <<< "${HOSTS_RAW}"

ALT_NAMES=()
dns_index=1
ip_index=1

for raw_host in "${HOSTS[@]}"; do
  host="$(printf '%s' "${raw_host}" | xargs)"
  if [[ -z "${host}" ]]; then
    continue
  fi

  if [[ "${host}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ALT_NAMES+=("IP.${ip_index} = ${host}")
    ip_index=$((ip_index + 1))
  else
    ALT_NAMES+=("DNS.${dns_index} = ${host}")
    dns_index=$((dns_index + 1))
  fi
done

if [[ "${#ALT_NAMES[@]}" -eq 0 ]]; then
  ALT_NAMES+=("DNS.1 = localhost")
fi

COMMON_NAME="${HOSTS[0]}"
TMP_CONFIG="$(mktemp)"
trap 'rm -f "${TMP_CONFIG}"' EXIT

{
  printf '[req]\n'
  printf 'distinguished_name = req_distinguished_name\n'
  printf 'x509_extensions = req_ext\n'
  printf 'prompt = no\n\n'
  printf '[req_distinguished_name]\n'
  printf 'CN = %s\n\n' "${COMMON_NAME}"
  printf '[req_ext]\n'
  printf 'subjectAltName = @alt_names\n\n'
  printf '[alt_names]\n'
  printf '%s\n' "${ALT_NAMES[@]}"
} > "${TMP_CONFIG}"

openssl req \
  -x509 \
  -nodes \
  -newkey rsa:2048 \
  -sha256 \
  -days 365 \
  -keyout "${KEY_FILE}" \
  -out "${CERT_FILE}" \
  -config "${TMP_CONFIG}" \
  -extensions req_ext

printf 'Generated HTTPS dev certificate:\n'
printf '  key:  %s\n' "${KEY_FILE}"
printf '  cert: %s\n' "${CERT_FILE}"
printf 'Hosts: %s\n' "${HOSTS_RAW}"
