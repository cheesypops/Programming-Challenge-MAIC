# Programming-Challenge-MAIC

Creador de dashboards con IA "Analisis al Instante".

## Configuracion y ejecucion local

### Requisitos

- Node.js 18+
- Python 3.11+
- pip

### Backend (FastAPI)

1) Crear y activar un entorno virtual en Windows:

```powershell
python -m venv .venv
.venv\Scripts\Activate
```

2) Instalar dependencias:

```powershell
cd backend
pip install -r requirements.txt
```

3) Configurar variables de entorno (crear backend/.env):

```dotenv
GOOGLE_API_KEY=tu_api_key
GOOGLE_MODEL=modelo_a_utilizar
```

4) Ejecutar el servidor:

```powershell
uvicorn main:app --reload
```

El backend queda en `http://localhost:8000`.

### Frontend (React + Vite)

1) Instalar dependencias:

```powershell
cd frontend
npm install
```

2) (Opcional) Configurar el endpoint de API en `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

3) Ejecutar el frontend:

```powershell
npm run dev
```

El frontend queda en `http://localhost:5173`.

## Decisiones tecnicas

### Backend

- **FastAPI**: framework rapido para APIs, con tipado, validacion y Swagger automatico.
- **pandas**: lectura y analisis de datos para CSV/XLSX.
- **google-genai**: cliente oficial para Google AI Studio (Gemini).
- **python-dotenv**: carga de variables desde `.env`.
- **openpyxl**: soporte para lectura de archivos `.xlsx`.

### Frontend

- **React + Vite**: desarrollo rapido y SPA moderna.
- **@tanstack/react-query**: manejo de estados async, cache de requests y loading/error.
- **Recharts**: graficos declarativos, facil de integrar con JSON.
- **Persistencia local**: `localStorage` para mantener dashboard tras recargar.

### Arquitectura de datos

- El backend procesa el archivo, genera resumen y pide sugerencias al LLM.
- El frontend muestra tarjetas de sugerencias y pide solo los datos necesarios
	para cada grafico, evitando enviar el dataset completo al cliente.

## Enfoque de ingenieria de prompts

- Prompt en **espanol** para respuestas consistentes con el UI.
- Se obliga a que la respuesta sea **solo JSON valido** (sin markdown ni texto extra).
- Se define una estructura esperada para cada `chart_type` y sus `parameters`.
- Se pide usar nombres de columnas exactos del dataset para evitar errores.
- Se limita la cantidad de graficos (3 a 5) para mantener la UI usable.

Ejemplo de estructura solicitada al LLM:

```json
[
	{
		"title": "Titulo del grafico",
		"chart_type": "bar|line|pie|scatter|area|composed",
		"parameters": { "x_axis": "columna", "y_axis": "columna" },
		"insight": "Analisis breve en espanol"
	}
]
```

### Consideraciones adicionales

- Dado que se esta utilizando un modelo en su capa gratuita, la cantidad de peticiones por minuto y diarias esta limitada, asi como la calidad de las respuestas pueden mejorar cambiando de LLM.
- Existe una dependencia de la respuesta de la API del modelo.
- Para mejora del proyecto, considerar enviar junto al archivo csv/xlsx un breve resumen de que representan las columnas, dado que si la complejidad de los nombres de las colmunas es demasiado o esta muy orientado a conocimiento interno, el LLM puede llegar a realizar interpretaciones equivocadas, por tanto sería lo mejor enviar un contexto adicional para mejorar la calidad de los analisis.
- A su vez la implementación de una base de datos por parte del backend (MongoDB por ejemplo) para mantener el contexto total al momento de realizar una recarga de la aplicacion, ya que si bien se mantienen los graficos, se pierde la informacion del archivo y las peticiones de las tarjetas dejan de funcionar.
