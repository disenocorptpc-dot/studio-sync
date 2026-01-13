# Guía de Configuración: Dashboard Visual en Microsoft Teams

Dado que ya tienes el ecosistema Microsoft (Excel, Teams, Power Apps), esta es la forma más eficiente de lograr tu objetivo sin gastar un centavo extra ni aprender código.

## 1. El Cerebro: Excel con "Semáforos Automáticos"
Hemos creado un archivo CSV (`plantilla_dashboard_excel.csv`) que puedes abrir directamente en Excel. 
Este archivo ya tiene la lógica de "Alertas" que te gustó del prototipo, pero traducida a fórmulas de Excel.

### Cómo configurarlo para que se vea "Premium":
1. Abre el archivo CSV en Excel y guárdalo como **Libro de Excel (.xlsx)** en tu OneDrive o SharePoint del equipo.
2. Selecciona tus datos y dales formato de **Tabla** (Insertar > Tabla).
3. **Activar los Semáforos (Paso Clave):**
   - Selecciona la columna "Estado (Calculado)".
   - Ve a `Inicio > Formato Condicional > Reglas para resaltar celdas > Texto que contiene...`
   - Escribe "🔴" y elige relleno Rojo claro / Texto rojo oscuro.
   - Repite para "🟡" (Amarillo) y "🟢" (Verde).
   
*Resultado:* Ahora tienes una columna que se ilumina sola avisando qué proyectos necesitan atención urgente.

## 2. La Visibilidad: Integración en Teams
El problema que mencionaste es "perder de vista" los proyectos. La solución es poner este Excel donde NO puedas ignorarlo.

1. Ve a tu canal de **Teams** donde hablas con tu equipo de diseño (General o Proyectos).
2. En la parte superior, haz clic en el botón **`+`** (Agregar una pestaña).
3. Selecciona **Excel**.
4. Busca y selecciona el archivo `.xlsx` que acabas de guardar.
5. **IMPORTANTE:** Cámbiale el nombre a la pestaña a algo como **"🚨 RADAR DE PROYECTOS"** o **"STATUS BOARD"**.

## 3. Automatización de Recordatorios (Nivel Pro con Power Automate)
Mencionaste que querías recordatorios. Ya que tienes acceso a **Power Automate** (venía en tu captura de pantalla), puedes hacer esto:

1. Entra a [make.powerautomate.com](https://make.powerautomate.com).
2. Crea un flujo nuevo: "Flujo de nube programada" (Scheduled Cloud Flow).
3. Ponlo para que corra todos los lunes a las 9:00 AM.
4. Pasos del flujo:
   - `List rows present in a table` (apunta a tu Excel en Teams).
   - `Condition`: Si la columna "Días Restantes" es menor a 3.
   - `Post message in chat or channel`: "⚠️ **Atención Equipo:** El proyecto [Nombre] vence en menos de 3 días."

## Resumen del Flujo de Trabajo
1. Tu equipo actualiza el Excel los viernes.
2. Tú lo revisas directamente en la pestaña de Teams los lunes.
3. El formato condicional te grita visualmente qué está en riesgo.
4. Nadie tiene que abrir otra app ni loguearse en sitios externos.
