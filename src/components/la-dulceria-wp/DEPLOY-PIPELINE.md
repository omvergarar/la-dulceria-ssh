# Pipeline de Despliegue Automático: Local → GitHub → Hostinger (WordPress)

## Descripción

Pipeline CI/CD para proyectos WordPress en Hostinger Shared Hosting.
Flujo: cambios locales → commit → push a GitHub → GitHub Actions despliega automáticamente via FTP.

---

## Estructura del repositorio

Incluir SOLO los archivos propios del proyecto. NO incluir WordPress core, WooCommerce ni plugins de terceros.

```
wp-content/
  themes/mi-tema/
  plugins/mi-plugin-1/
  plugins/mi-plugin-2/
.github/
  workflows/
    deploy.yml
```

---

## Workflow: `.github/workflows/deploy.yml`

```yaml
name: Deploy a Hostinger

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          port: 21
          protocol: ftp
          local-dir: ./wp-content/
          server-dir: wp-content/
          dangerous-clean-slate: false
          exclude: |
            **/.git*
            **/.git*/**
            **/*.md
```

---

## Secretos en GitHub

Ir a: **Repositorio → Settings → Secrets and variables → Actions → Repository secrets**

| Secreto | Valor |
|---------|-------|
| `FTP_SERVER` | IP del servidor sin `ftp://` — ej: `157.173.208.249` |
| `FTP_USERNAME` | Usuario FTP de Hostinger |
| `FTP_PASSWORD` | Contraseña FTP de Hostinger |

### Dónde encontrar las credenciales FTP en Hostinger
hPanel → **Archivos → Cuentas FTP**
La contraseña se crea o cambia desde ese mismo panel.

---

## Reglas críticas (errores comunes a evitar)

### 1. `server-dir` sin barra inicial y sin `public_html`
El FTP de Hostinger conecta en la raíz del usuario, no en `/public_html`.

| Valor | Resultado |
|-------|-----------|
| `wp-content/` ✅ | Correcto — sube a `public_html/wp-content/` |
| `/wp-content/` ❌ | Crea carpeta fuera de `public_html` |
| `public_html/wp-content/` ❌ | Crea `public_html/public_html/wp-content/` |
| `/public_html/wp-content/` ❌ | Error de ruta absoluta |

### 2. Usar `protocol: ftp` no `ftps`
Hostinger bloquea FTPS desde IPs de GitHub Actions intermitentemente.

### 3. `FTP_SERVER` sin prefijo
El secreto debe contener solo IP u hostname:
- ✅ `157.173.208.249`
- ❌ `ftp://157.173.208.249`

### 4. Repositorio público
Los secretos de GitHub Actions no funcionan en repositorios privados en el plan gratuito de GitHub. Usar repositorio **público** — los secretos FTP siguen siendo privados aunque el repo sea público.

### 5. No usar `dangerous-clean-slate: true`
Borraría WooCommerce y todos los plugins de terceros instalados en el servidor.

### 6. SSH bloqueado desde GitHub Actions
Hostinger bloquea el puerto 65002 (SSH) desde los IPs de GitHub Actions. No intentar deploy via SSH/SCP/SFTP desde el workflow.

---

## Primer despliegue

La primera vez el workflow detecta que no existe `.ftp-deploy-sync-state.json` y sube todos los archivos. Los deploys siguientes solo suben los archivos modificados — son rápidos (1-2 segundos).

### Si el tema no aparece en WordPress después del primer deploy
1. hPanel → File Manager → `public_html/wp-content/themes/`
2. Comprimir la carpeta del tema en ZIP
3. WordPress admin → **Apariencia → Temas → Añadir nuevo → Subir tema**
4. Activar el tema

### Después de activar el tema
Ir a **Ajustes → Enlaces permanentes → Guardar cambios** (sin cambiar nada) para regenerar las URLs de WooCommerce.

---

## Flujo de trabajo diario

```bash
# Abrir Git Bash en la carpeta del proyecto
cd "ruta/al/proyecto"

# Ver archivos modificados
git status

# Agregar cambios
git add .

# Commit con descripción
git commit -m "descripcion del cambio"

# Push — dispara el deploy automático
git push
```

En 1-2 minutos los cambios están en Hostinger.

Verificar el estado del deploy en:
```
https://github.com/usuario/repositorio/actions
```

---

## Notas adicionales

- El archivo `.ftp-deploy-sync-state.json` se guarda en `wp-content/` del servidor. No borrarlo — es el que permite deploys incrementales rápidos.
- Si se borran archivos del servidor manualmente, el siguiente deploy los restaura automáticamente.
- Para forzar un redeploy completo sin cambios de código: `git commit --allow-empty -m "Force redeploy" && git push`
