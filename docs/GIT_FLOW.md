# Git Flow — El Bodegón de los Trajes

Este proyecto usa la convención de ramas **Git Flow**. El objetivo es mantener **`main` siempre estable** y desarrollar en ramas separadas sin revolver el código.

---

## Ramas principales

| Rama | Rol |
|------|-----|
| **`main`** | Producción. Siempre debe estar estable y desplegable. |
| **`develop`** | Integración. Aquí se fusionan las funciones terminadas antes de pasar a `main`. |

## Ramas de soporte

| Rama | Nace de | Se fusiona en | Uso |
|------|---------|---------------|-----|
| **`feature/*`** | `develop` | `develop` | Nuevas funciones (p. ej. `feature/chat-cliente`). |
| **`hotfix/*`** | `main` | `main` y `develop` | Correcciones urgentes de producción. |
| **`release/*`** | `develop` | `main` y `develop` | Preparación de una versión (opcional). |

---

## Comandos básicos

### 1. Clonar / configurar el repositorio

```bash
# (una vez) clonar
git clone https://github.com/avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262.git
cd EL-BODEGON-DELOS-TRAJES-20262

# Crear rama develop desde main si aún no existe
git checkout main
git checkout -b develop
git push -u origin develop
```

### 2. Flujo típico de una función nueva

```bash
git checkout develop
git checkout -b feature/nombre-de-la-funcion   # salir de develop

# ... trabajar y confirmar cambios ...
git add .
git commit -m "feat: descripción clara de la función"

# integrar en develop
git checkout develop
git merge --no-ff feature/nombre-de-la-funcion
git branch -d feature/nombre-de-la-funcion
git push origin develop
```

### 3. Publicar una versión a producción (main)

```bash
git checkout develop
git checkout -b release/v1.0.0      # opcional
# ... ajustes finales, revisión ...

git checkout main
git merge --no-ff release/v1.0.0    # o: git merge --no-ff develop
git tag -a v1.0.0 -m "Versión 1.0.0"
git push origin main --tags

git checkout develop
git merge --no-ff main
git push origin develop
```

### 4. Hotfix urgente (a producción)

```bash
git checkout main
git checkout -b hotfix/correccion-urgente
# ... corregir y confirmar ...
git checkout main
git merge --no-ff hotfix/correccion-urgente
git tag -a v1.0.1 -m "Corrección urgente"
git push origin main --tags

git checkout develop
git merge --no-ff hotfix/correccion-urgente
git push origin develop
```

---

## Convenciones de mensajes de commit

Usar **Conventional Commits** para historial claro:

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva función |
| `fix:` | Corrección de error |
| `docs:` | Cambios de documentación |
| `style:` | Formato / estilo (sin lógica) |
| `refactor:` | Cambio de estructura sin cambiar comportamiento |
| `chore:` | Tareas de mantenimiento |

Ejemplos:
```
feat: agregar bot de ayuda al cliente
fix: corregir navegación desde disfraces
docs: documentar arquitectura y Git Flow
```

---

## Notas

- **No hacer `push` directo a `main`**; todo pasa por `develop` y ramas de soporte (o un PR con revisión en GitHub).
- Mantener `main` y `develop` **siempre verdes** (que no rompan build/despliegue).
- Para automatizar, se puede usar GitHub Actions (ver `.github/workflows/`).

---

## Repositorio remoto

- URL: `https://github.com/avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262.git`
- `origin` apunta a este remoto. El `push` lo realiza el propietario desde su máquina con sus credenciales.
