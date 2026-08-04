#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JDK_DIR="$PROJECT_DIR/.tools/jdk21"
SIGNING_DIR="$PROJECT_DIR/.signing"
KEYSTORE="$SIGNING_DIR/tupedido360-upload.jks"
CERTIFICATE="$SIGNING_DIR/tupedido360-upload-certificate.pem"
ALIAS="tupedido360-upload"
UNSIGNED_BUNDLE="$PROJECT_DIR/android/app/build/outputs/bundle/release/app-release.aab"
SIGNED_BUNDLE="$PROJECT_DIR/TuPedido360-Play-v3.aab"
GOOGLE_SERVICES="$PROJECT_DIR/android/app/google-services.json"

if [[ ! -x "$JDK_DIR/bin/java" ]]; then
  echo "No se encontró Java 21 en $JDK_DIR."
  exit 1
fi

if [[ ! -s "$GOOGLE_SERVICES" ]]; then
  echo "Falta android/app/google-services.json. Descárguelo desde Firebase antes de crear la versión de Play Store."
  exit 1
fi

mkdir -p "$SIGNING_DIR"
chmod 700 "$SIGNING_DIR"

if [[ -f "$KEYSTORE" ]]; then
  echo "Se usará la clave de carga existente. No cree otra para las actualizaciones."
  read -r -s -p "Contraseña de la clave de carga: " STORE_PASSWORD
  echo
else
  echo "Creando la clave privada de carga de TuPedido360."
  read -r -s -p "Cree una contraseña segura (mínimo 12 caracteres): " STORE_PASSWORD
  echo
  read -r -s -p "Repita la contraseña: " STORE_PASSWORD_CONFIRMATION
  echo
  if [[ ${#STORE_PASSWORD} -lt 12 ]]; then
    echo "La contraseña debe tener al menos 12 caracteres."
    exit 1
  fi
  if [[ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRMATION" ]]; then
    echo "Las contraseñas no coinciden."
    exit 1
  fi
  "$JDK_DIR/bin/keytool" -genkeypair \
    -keystore "$KEYSTORE" \
    -storetype PKCS12 \
    -storepass "$STORE_PASSWORD" \
    -keypass "$STORE_PASSWORD" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 4096 \
    -validity 10000 \
    -dname "CN=TuPedido360, OU=Aplicaciones, O=Imagen Plus AMD, L=Bogota, ST=Cundinamarca, C=CO"
  chmod 600 "$KEYSTORE"
fi

"$JDK_DIR/bin/keytool" -list -keystore "$KEYSTORE" -storepass "$STORE_PASSWORD" -alias "$ALIAS" >/dev/null

cd "$PROJECT_DIR"
npx cap sync android
cd android
JAVA_HOME="$JDK_DIR" ./gradlew bundleRelease

cp "$UNSIGNED_BUNDLE" "$SIGNED_BUNDLE"
"$JDK_DIR/bin/jarsigner" \
  -keystore "$KEYSTORE" \
  -storepass "$STORE_PASSWORD" \
  -keypass "$STORE_PASSWORD" \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  "$SIGNED_BUNDLE" "$ALIAS"

"$JDK_DIR/bin/jarsigner" -verify "$SIGNED_BUNDLE"
"$JDK_DIR/bin/keytool" -exportcert -rfc \
  -keystore "$KEYSTORE" \
  -storepass "$STORE_PASSWORD" \
  -alias "$ALIAS" \
  -file "$CERTIFICATE" >/dev/null

unset STORE_PASSWORD STORE_PASSWORD_CONFIRMATION

echo
echo "AAB firmado y verificado: $SIGNED_BUNDLE"
echo "Clave privada: $KEYSTORE"
echo "Guarde una copia segura de la clave y recuerde su contraseña."
