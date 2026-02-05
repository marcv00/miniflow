# 🚀 MiniFlow Builder

MiniFlow es un editor visual de flujos de trabajo (workflows) construido con **ReactFlow**. El proyecto utiliza una arquitectura **MVVM (Model-View-ViewModel)** y **CSS Modules** para garantizar un código modular, escalable y profesional.

---

## 🏗️ Arquitectura del Proyecto

El proyecto se divide en tres capas principales para separar la lógica de negocio de la interfaz de usuario.



### 📂 Estructura de Directorios

#### 1. Models (`src/models/`)
Es la capa de datos y lógica pura. No depende de React ni de la interfaz.
* **`workflow/`**: Contiene la "inteligencia" del sistema.
    * `types.ts`: Definiciones de TypeScript para nodos, configuración y esquemas de datos.
    * `WorkflowValidator.ts`: Lógica para validar que el flujo sea correcto (ej. evitar ciclos, verificar conexiones obligatorias).
    * `WorkflowFactory.ts`: Utilidades para instanciar nuevos nodos y estructuras de datos.
    * `WorkflowExporters.ts`: Lógica para transformar el workflow a formatos como `.json` o código `.java`.
* **`storage/`**:
    * `LocalStorage.ts`: Abstracción para el guardado persistente en el navegador.

#### 2. ViewModels (`src/viewmodels/`)
Es el puente entre los modelos y la vista. Maneja el estado y las interacciones.
* `useWorkflowViewModel.ts`: El ViewModel principal que coordina ReactFlow con la lógica de negocio.
* `useWorkflowStorage.ts`: Encargado de sincronizar el estado del editor con el almacenamiento persistente.
* `useWorkflowIO.ts`: Gestiona la entrada y salida de archivos (import/export).

#### 3. Views (`src/views/`)
La capa de presentación. Se encarga únicamente de renderizar la interfaz.
* **`components/`**: Widgets y paneles de la aplicación como `Sidebar` y `NodeConfigPanel`.
* **`nodes/`**: Contiene los componentes de los nodos personalizados (`StartNode`, `CommandNode`).
    * `nodeTypes.ts`: Configuración que vincula los tipos de nodos con sus respectivos componentes.

---

## 🎨 Sistema de Estilos: CSS Modules

Para evitar colisiones de nombres y mantener el código limpio, utilizamos **CSS Modules**.



### Principios de Estilizado:
1.  **Co-location**: Cada componente (`.tsx`) tiene su propio archivo de estilos (`.module.css`) en la misma carpeta.
2.  **Encapsulamiento**: Las clases son locales al componente. Una clase `.btn` en el Sidebar no afectará a los botones de la Topbar.
3.  **Globalidad Mínima**: 
    * `src/index.css`: Solo contiene resets de CSS y sobrescrituras de las clases internas de ReactFlow (ej. `.react-flow__handle`).
    * `src/App.module.css`: Define el layout principal (Grid de 3 columnas).

---

## 🛠️ Tecnologías Principales

* **React + Vite**: Desarrollo rápido y construcción eficiente.
* **ReactFlow**: Motor potente para la visualización de nodos y grafos.
* **TypeScript**: Tipado estricto para reducir errores en el manejo de flujos.
* **Electron**: Configuración disponible (`electron.d.ts`) para distribución de escritorio.


## ☕ Guía de Desarrollo del Motor Java (Engine)

Si quieres contribuir a la lógica central de MiniFlow, trabajarás en el módulo `java-engine`. Dado que el motor se comunica con la app de escritorio (Electron) mediante la entrada/salida estándar (STDIN/STDOUT), el flujo de trabajo es un poco distinto al de una aplicación Java tradicional.

### 1. Requisitos Previos
Antes de empezar, asegúrate de tener instalado:

* **Java Development Kit (JDK) 17+**
* **Apache Maven**: El motor depende de Maven para gestionar dependencias y generar el "Fat JAR".
    * [Descarga Maven aquí](https://maven.apache.org/download.cgi)

### 2. Configuración del PATH (Windows)
Para ejecutar los comandos de construcción desde la raíz del proyecto, `mvn` debe ser accesible globalmente:
1.  Extrae el zip de Maven en `C:\maven`.
2.  Busca **Variables de Entorno** en Windows.
3.  En **Variables del Sistema**, busca `Path` y haz clic en **Editar**.
4.  Añade `C:\maven\bin` a la lista.
5.  Reinicia tu terminal y verifica con el comando `mvn -version`.

### 3. Flujo de Trabajo (Workflow)
La aplicación de Electron no ejecuta los archivos `.java` directamente; ejecuta un archivo `.jar` compilado. Por lo tanto, cada vez que hagas un cambio en el código Java, debes recompilar el motor para que Electron pueda "ver" las actualizaciones.

**El ciclo de prueba:**
1.  **Modifica** el código fuente en `java-engine/src/main/java`.
2.  **Recompilar y Sincronizar**: Ejecuta el script de construcción desde la carpeta **raíz** del proyecto:
    * **Windows**: `npm run build:engine`
    * **Mac/Linux**: `npm run build:engine-mac`
    * *Este script limpia el proyecto, empaqueta el nuevo JAR y lo mueve automáticamente a `dist-java-engine/engine.jar`.*
3.  **Lanza la App**: Ejecuta `npm run dev:electron` para iniciar la interfaz de escritorio.
4.  **Ejecuta**: Crea o carga un flujo en la UI y presiona el botón de ejecución para probar tu nueva lógica en Java.

> **Nota Importante:** El motor utiliza Jackson para el procesamiento de JSON. Si añades nuevas dependencias al `pom.xml`, asegúrate de que estén configuradas en el "shaded JAR" para evitar errores de tipo `ClassNotFoundException` en tiempo de ejecución.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
