# Academic Tracker Pro

**Academic Tracker Pro** es una aplicación web integral diseñada para capacitar a los docentes en la gestión y seguimiento del rendimiento académico de sus estudiantes. La plataforma centraliza la administración de grupos, calificaciones, asistencia y observaciones conductuales, utilizando la inteligencia artificial para ofrecer análisis profundos y retroalimentación personalizada.

## Funcionalidades Principales

A continuación, se detalla cada una de las secciones y funcionalidades de la aplicación.

---

### 1. Dashboard (Panel Principal)

Es la vista principal al iniciar la aplicación. Ofrece un resumen global y acceso rápido a la información más relevante.

-   **Tarjetas de Estadísticas Rápidas**:
    -   **Estudiantes Activos**: Conteo total de estudiantes únicos registrados en todos los grupos.
    -   **Grupos Creados**: Número total de asignaturas o grupos que has creado.
    -   **Estudiantes en Riesgo**: Conteo de estudiantes que requieren atención especial, calculado según su calificación y asistencia en el parcial activo.
    -   **Asistencia Media**: Porcentaje de asistencia promedio considerando todas las clases registradas en el grupo activo.
-   **Búsqueda Rápida de Estudiantes**: Un buscador que permite encontrar el perfil de cualquier estudiante por su nombre, mostrando resultados instantáneos para una navegación ágil.
-   **Resumen de Grupos Recientes**: Una tabla que muestra tus grupos, el número de estudiantes en cada uno y su calificación promedio para el parcial activo.
-   **Panel de Alertas**: Un apartado dedicado a los estudiantes en riesgo (con nivel medio o alto), permitiendo filtrar por grupo para un análisis enfocado. Desde aquí, se puede acceder a una vista detallada de todos los estudiantes que requieren seguimiento.

---

### 2. Grupos

Esta sección es el núcleo de la organización. Un "grupo" representa una clase, materia o asignatura que impartes.

-   **Creación de Grupos**: Permite crear nuevos grupos especificando el nombre de la asignatura, semestre, nombre del grupo (ej. "A", "TSPA") y el nombre del facilitador.
-   **Gestión de Estudiantes**:
    -   **Añadir Estudiantes en Masa**: Una potente función que permite pegar listas de datos (nombres, correos, teléfonos, nombres de tutores, teléfonos de tutores) desde una hoja de cálculo para registrar múltiples estudiantes de una sola vez.
    -   **Lista de Estudiantes**: Visualiza a todos los estudiantes del grupo, con su foto y nivel de riesgo actual.
    -   **Selección Múltiple**: Permite seleccionar a varios estudiantes para eliminarlos del grupo de forma conjunta.
-   **Gestión de Parciales**: Puedes cambiar entre **Primer, Segundo y Tercer Parcial** usando las pestañas en la parte superior. Toda la información de calificaciones, asistencia y riesgo se ajusta al parcial seleccionado.
-   **Acciones del Grupo**: Accesos directos para:
    -   **Tomar Asistencia**: Ir a la pantalla de registro de asistencia.
    -   **Registrar Participaciones**: Ir a la pantalla de registro de participaciones.
    -   **Gestionar Criterios**: Definir los rubros de evaluación para el parcial activo.
    -   **Registrar Calificaciones**: Ir a la pantalla para capturar las calificaciones.

---

### 3. Bitácora

Un diario digital para registrar eventos importantes relacionados con el comportamiento y seguimiento de los estudiantes.

-   **Registro de Observaciones**: Para un estudiante seleccionado, puedes registrar:
    -   **Tipo de Observación**: Elige entre `Problema de conducta`, `Episodio emocional`, `Mérito`, `Demérito`, `Asesoría académica` u `Otros`.
    -   **Descripción Detallada**: Un campo de texto para describir el suceso.
    -   **Canalización y Seguimiento**: Opciones para marcar si el caso requiere ser canalizado a otra instancia (tutor, psicólogo) y si necesita seguimiento posterior.
-   **Bitácora Reciente**: Muestra las últimas 5 observaciones registradas en el grupo activo para tener una vista rápida de los eventos más recientes.

---

### 4. Calificaciones

Aquí se definen los criterios de evaluación y se capturan las calificaciones de los estudiantes para cada parcial.

-   **Gestión de Criterios de Evaluación**:
    -   Define los rubros que componen la calificación final (ej. `Examen`, `Actividades`, `Proyecto`).
    -   Asigna un **peso porcentual** a cada criterio. La suma total no puede exceder el 100%.
    -   Establece un **valor esperado** para cada criterio (ej. `10` tareas, `100` puntos en el examen).
    -   Los criterios "Actividades", "Portafolio" y "Participación" son de **cálculo automático** y no requieren un valor esperado manual.
-   **Registro de Calificaciones**:
    -   Una tabla muestra a todos los estudiantes y los criterios definidos.
    -   Para criterios manuales, ingresa el valor "logrado" por el estudiante (ej. 8 de 10 tareas).
    -   Para criterios automáticos, el sistema muestra el desempeño calculado (ej. "8 de 10 entregas").
    -   El sistema calcula automáticamente el **porcentaje ganado** para cada criterio y la **calificación final** del parcial en tiempo real.

---

### 5. Asistencia, Participaciones y Actividades

Módulos dedicados para el seguimiento diario y continuo.

-   **Asistencia**:
    -   Registra la asistencia del día para el grupo activo con un solo clic.
    -   Una matriz muestra las fechas y permite marcar/desmarcar la asistencia (presente/ausente) para cada estudiante.
-   **Participaciones**:
    -   Funciona de manera similar a la asistencia, pero registra si un estudiante participó en clase.
    -   El sistema valida que un estudiante no puede tener participación si tiene inasistencia en ese día.
-   **Actividades**:
    -   Registra actividades o tareas para el grupo, asignando un nombre y una fecha de entrega.
    -   En una matriz, marca si cada estudiante cumplió con la entrega de cada actividad.

---

### 6. Evaluación Semestral

Ofrece una vista consolidada del rendimiento de los estudiantes a lo largo de todo el semestre.

-   Muestra una tabla con todos los estudiantes del grupo activo.
-   Presenta la calificación final obtenida en el **Primer, Segundo y Tercer Parcial**.
-   Calcula y muestra el **promedio semestral** final para cada estudiante, destacando visualmente si es aprobatorio o reprobatorio.

---

### 7. Informes (con IA)

Esta sección permite generar reportes detallados y profesionales.

-   **Reporte General del Grupo**:
    -   Genera un informe en PDF para un parcial específico.
    -   Incluye estadísticas clave: aprobación, promedio, asistencia, estudiantes en riesgo.
    -   **Función de IA**: Un botón permite generar un **análisis de texto narrativo** sobre el rendimiento del grupo, redactado de manera profesional.
-   **Reporte de Riesgo**: Analiza a los estudiantes con riesgo alto o medio y genera fichas individuales con el desglose de su rendimiento, asistencia y observaciones en la bitácora.
-   **Informe Individual por Estudiante**:
    -   Genera un perfil completo y descargable en PDF para un estudiante específico.
    -   Incluye su información de contacto, desglose de calificaciones por parcial, promedio semestral y un historial de observaciones de la bitácora.
    -   **Función de IA**: Un botón permite generar una **retroalimentación constructiva y personalizada** en formato de texto, analizando las fortalezas y áreas de oportunidad del estudiante basadas en sus datos.

---

### 8. Estadísticas

Visualizaciones gráficas para analizar tendencias y patrones en el rendimiento del grupo activo.

-   **Gráficas de Pastel**:
    -   **Riesgo del Grupo**: Distribución porcentual de estudiantes en riesgo bajo, medio y alto.
    -   **Índice de Aprobación**: Porcentaje de estudiantes aprobados vs. reprobados.
    -   **Índice de Asistencia**: Porcentaje de asistencias vs. inasistencias.
-   **Gráficas de Barras**:
    -   **Mejores Calificaciones**: Muestra a los 5 estudiantes con el mejor rendimiento.
    -   **Distribución de Participación**: Clasifica a los estudiantes según su rango de participación en clase.

---

### 9. Contacto y Soporte

-   **Directorio de Tutores**: Una lista de todos los tutores registrados, agrupados por nombre, con la información de contacto y a qué estudiante(s) están asociados. Incluye un buscador para encontrar rápidamente a un tutor o estudiante.
-   **Soporte Técnico y Ventas**: Información de contacto para obtener ayuda con la aplicación.

---

### 10. Ajustes

Permite personalizar la experiencia y gestionar los datos de la aplicación.

-   **Personalización**: Cambia el nombre de la institución y sube un logo, que aparecerán en los informes generados.
-   **Temas Visuales**: Elige entre múltiples paletas de colores para cambiar la apariencia de toda la aplicación.
-   **Copia de Seguridad y Restauración**:
    -   **Exportar**: Descarga un archivo JSON con todos tus datos (grupos, estudiantes, calificaciones, etc.).
    -   **Importar**: Restaura la aplicación desde un archivo de respaldo. **Esta acción sobreescribe todos los datos actuales.**
-   **Restablecer Datos**: Una opción para borrar completamente toda la información de la aplicación y empezar desde cero.