# Academic Tracker - Sistema de Seguimiento Académico

**Academic Tracker** es una aplicación web integral diseñada para la gestión y seguimiento del rendimiento académico de estudiantes. La plataforma centraliza la administración de grupos, calificaciones, asistencia y observaciones conductuales.

---

## 🚀 Inicio Rápido

### Modo Demo (Sin Firebase) - Recomendado para pruebas

La aplicación puede funcionar completamente sin conexión a Firebase, ideal para pruebas y demostraciones:

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/Cetc2211/Ac_Tracapp.git
   cd Ac_Tracapp
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura el modo demo**
   
   Crea un archivo `.env.local` con:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   ```

4. **Ejecuta la aplicación**
   ```bash
   npm run dev
   ```

5. **Accede a la aplicación**
   
   Abre `http://localhost:3000` y usa **cualquier credencial** para iniciar sesión (ej: `demo@test.com` / `123456`)

---

## 📋 Funcionalidades Principales

### 1. Dashboard (Panel Principal)
- **Estadísticas Rápidas**: Estudiantes activos, grupos, estudiantes en riesgo, asistencia media
- **Búsqueda Rápida**: Encuentra estudiantes por nombre
- **Resumen de Grupos**: Tabla con grupos y calificaciones promedio
- **Panel de Alertas**: Estudiantes en riesgo con filtrado por grupo

### 2. Grupos
- **Creación de Grupos**: Asignaturas con semestre y facilitador
- **Gestión de Estudiantes**: Añadir en masa, lista con fotos y nivel de riesgo
- **Gestión de Parciales**: Primer, Segundo y Tercer Parcial
- **Acciones Rápidas**: Asistencia, participaciones, criterios, calificaciones

### 3. Bitácora
- **Registro de Observaciones**: Conducta, emocional, mérito, demérito, asesoría
- **Canalización**: Opciones para derivar a tutor, psicólogo, directivo
- **Seguimiento**: Registro de actualizaciones posteriores

### 4. Calificaciones
- **Criterios de Evaluación**: Pesos porcentuales, valores esperados
- **Cálculo Automático**: Porcentaje ganado y calificación final en tiempo real
- **Criterios Automáticos**: Actividades, portafolio, participación

### 5. Asistencia, Participaciones y Actividades
- **Asistencia**: Registro diario con matriz visual
- **Participaciones**: Seguimiento de intervención en clase
- **Actividades**: Tareas con fechas de entrega y cumplimiento

### 6. Evaluación Semestral
- Vista consolidada del rendimiento por parcial
- Promedio semestral final con indicadores visuales

### 7. Informes (con IA)
- **Reporte General**: PDF con estadísticas y análisis narrativo
- **Reporte de Riesgo**: Fichas individuales de estudiantes en riesgo
- **Informe Individual**: Perfil completo con retroalimentación personalizada

### 8. Estadísticas
- **Gráficas de Pastel**: Riesgo, aprobación, asistencia
- **Gráficas de Barras**: Mejores calificaciones, distribución de participación

### 9. Panel de Tutoría
- Vista para tutores asignados a grupos oficiales
- Seguimiento de estudiantes del grupo tutelado

### 10. Grupos Oficiales
- Grupos institucionales gestionados por administradores
- Asignación de tutores por email

---

## 🛠️ Tecnologías

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **UI**: shadcn/ui components
- **Base de Datos**: Firebase Firestore (o modo demo local)
- **Autenticación**: Firebase Auth (o modo demo)
- **Gráficas**: Recharts
- **PDF**: jsPDF, react-to-print

---

## 📁 Estructura del Proyecto

```
Ac_Tracapp/
├── src/
│   ├── app/              # Rutas de Next.js (App Router)
│   │   ├── admin/        # Panel de administración
│   │   ├── groups/       # Gestión de grupos
│   │   ├── grades/       # Calificaciones
│   │   ├── attendance/   # Asistencia
│   │   ├── reports/      # Informes
│   │   └── ...
│   ├── components/       # Componentes React
│   │   └── ui/           # Componentes shadcn/ui
│   ├── hooks/            # Hooks personalizados
│   │   ├── use-data.tsx           # Hook de datos con Firebase
│   │   ├── use-auth.ts            # Autenticación unificada
│   │   └── use-admin.ts           # Hook de administrador
│   └── lib/              # Utilidades y configuración
│       ├── firebase.ts   # Configuración Firebase
│       ├── demo-data.ts  # Datos de demostración
│       └── definitions.ts # Tipos TypeScript
├── public/               # Archivos estáticos
└── ...config files
```

---

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `NEXT_PUBLIC_DEMO_MODE` | `true` para modo demo, `false` para Firebase | Sí |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase | Si no es demo |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación | Si no es demo |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto | Si no es demo |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento | Si no es demo |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | Si no es demo |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de la aplicación | Si no es demo |

---

## 📱 Características del Modo Demo

- ✅ Funciona 100% offline
- ✅ Datos almacenados en localStorage
- ✅ No requiere configuración de Firebase
- ✅ Incluye datos de ejemplo (30 estudiantes, 6 grupos)
- ✅ Perfecto para pruebas y demostraciones
- ✅ Banner amarillo indicando "Modo Demo"

---

## 🔐 Datos de Demostración

El modo demo incluye:

- **6 Grupos** del 1° al 6° Semestre
- **30 Estudiantes** con información de tutores
- **Criterios de evaluación** estándar
- **Calificaciones, asistencia y participaciones** de ejemplo
- **Anuncios y justificaciones** de ejemplo

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@academic-tracker.com

---

**Desarrollado con ❤️ para la comunidad educativa**
