import io
import json
import os
import uuid
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
	from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional dependency until user adds it
	load_dotenv = None

try:
	from google import genai
except Exception:  # pragma: no cover - optional dependency until user adds it
	genai = None

try:
	from google.api_core import exceptions as google_exceptions
except Exception:  # pragma: no cover - optional dependency until user adds it
	google_exceptions = None


if load_dotenv is not None:
	load_dotenv()

app = FastAPI(title="Charts API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["https://analisis-al-instante-con-ia.vercel.app"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class ChartSuggestion(BaseModel):
	title: str
	chart_type: str
	parameters: Dict[str, Any]
	insight: str


class SuggestResponse(BaseModel):
	dataset_id: str
	suggestions: List[ChartSuggestion]


class ChartDataRequest(BaseModel):
	dataset_id: str
	parameters: Dict[str, Any]


class ChartDataResponse(BaseModel):
	data: List[Dict[str, Any]]


_DATASET_ID: Optional[str] = None
_DATAFRAME: Optional[pd.DataFrame] = None


def _load_dataframe(file: UploadFile) -> pd.DataFrame:
	filename = (file.filename or "").lower()
	content = file.file.read()
	if filename.endswith(".csv"):
		return pd.read_csv(io.BytesIO(content))
	if filename.endswith(".xlsx") or filename.endswith(".xls"):
		return pd.read_excel(io.BytesIO(content))
	raise HTTPException(status_code=400, detail="Unsupported file type")


def _dataset_summary(df: pd.DataFrame) -> str:
	buffer = io.StringIO()
	df.info(buf=buffer)
	info_text = buffer.getvalue()
	describe_text = df.describe(include="all").fillna("NA").to_string()
	columns = df.dtypes.astype(str).to_dict()
	return (
		"Columns and dtypes:\n"
		f"{json.dumps(columns, indent=2)}\n\n"
		"Info:\n"
		f"{info_text}\n"
		"Describe:\n"
		f"{describe_text}"
	)


def _call_llm(summary: str) -> List[Dict[str, Any]]:
	api_key = os.getenv("GOOGLE_API_KEY")
	if not api_key:
		raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY")
	if genai is None:
		raise HTTPException(
			status_code=500,
			detail="google-genai package is not installed",
		)

	client = genai.Client(api_key=api_key)
	model_name = os.getenv("GOOGLE_MODEL")
	prompt = (
		"Eres un analista de datos senior. Con base en el resumen del dataset, genera SOLO un JSON valido "
		"(sin markdown, sin ``` y sin texto adicional). La respuesta DEBE ser un arreglo de objetos "
		"con esta estructura base:\n\n"
		"[\n"
		"  {\n"
		"    \"title\": \"Titulo del grafico\",\n"
		"    \"chart_type\": \"bar|line|pie|scatter|area|composed\",\n"
		"    \"parameters\": { ... },\n"
		"    \"insight\": \"Analisis breve en espanol\"\n"
		"  }\n"
		"]\n\n"
		"Reglas importantes:\n"
		"- Devuelve SOLO el JSON, sin comillas de codigo ni texto extra.\n"
		"- Devuelve entre 4 y 8 sugerencias de graficas.\n"
		"- Usa nombres de columnas EXACTAMENTE como aparecen en el dataset.\n"
		"- Los parameters deben ajustarse al chart_type y a Recharts (libreria de React).\n\n"
		"Estructura esperada de parameters por tipo:\n"
		"- bar|line|area: {\"x_axis\": \"columna\", \"y_axis\": \"columna\", "
		"  \"group_by\": \"columna opcional\", \"agg\": \"sum|mean|count|min|max opcional\"}\n"
		"- scatter: {\"x_axis\": \"columna\", \"y_axis\": \"columna\", "
		"  \"size\": \"columna opcional\", \"color\": \"columna opcional\"}\n"
		"- pie: {\"name_key\": \"columna categoria\", \"value_key\": \"columna valor\", "
		"  \"agg\": \"sum|mean|count|min|max opcional\"}\n"
		"- composed: {\"x_axis\": \"columna\", \"series\": [" 
		"    {\"type\": \"bar|line|area\", \"y_axis\": \"columna\", "
		"     \"agg\": \"sum|mean|count|min|max opcional\"}" 
		"  ], \"group_by\": \"columna opcional\"}\n\n"
		"Siempre incluye solo los fields necesarios para eese chart_type.\n\n"
		f"Resumen del dataset:\n{summary}"
	)
	try:
		response = client.models.generate_content(
			model=model_name,
			contents=prompt,
		)
	except Exception as exc:
		if google_exceptions and isinstance(exc, google_exceptions.ResourceExhausted):
			raise HTTPException(
				status_code=429,
				detail="LLM rate limit exceeded",
			)
		exc_text = str(exc)
		if "429" in exc_text or "RESOURCE_EXHAUSTED" in exc_text.upper():
			raise HTTPException(
				status_code=429,
				detail="LLM rate limit exceeded",
			)
		raise HTTPException(status_code=500, detail=f"LLM request failed: {exc}")
	text = response.text.strip()
	try:
		parsed = json.loads(text)
	except json.JSONDecodeError as exc:
		raise HTTPException(status_code=500, detail=f"Invalid JSON from LLM: {text}")
	if not isinstance(parsed, list):
		raise HTTPException(status_code=500, detail="LLM response is not a JSON array")
	return parsed


@app.post("/charts/suggest", response_model=SuggestResponse)
def suggest_charts(file: UploadFile = File(...)) -> SuggestResponse:
	global _DATASET_ID, _DATAFRAME
	df = _load_dataframe(file)
	_DATASET_ID = str(uuid.uuid4())
	_DATAFRAME = df
	summary = _dataset_summary(df)
	suggestions_raw = _call_llm(summary)
	suggestions = [ChartSuggestion(**item) for item in suggestions_raw]
	return SuggestResponse(dataset_id=_DATASET_ID, suggestions=suggestions)


@app.post("/charts/data", response_model=ChartDataResponse)
def chart_data(request: ChartDataRequest) -> ChartDataResponse:
	if _DATASET_ID is None or _DATAFRAME is None:
		raise HTTPException(status_code=400, detail="No dataset available")
	if request.dataset_id != _DATASET_ID:
		raise HTTPException(status_code=400, detail="Dataset ID not found")

	df = _DATAFRAME
	params = request.parameters
	chart_type = params.get("chart_type")

	x_axis = params.get("x_axis")
	y_axis = params.get("y_axis")
	group_by = params.get("group_by")
	agg = params.get("agg", "sum")

	if not x_axis:
		raise HTTPException(status_code=400, detail="Missing x_axis in parameters")

	if chart_type == "composed":
		series = params.get("series")
		if not isinstance(series, list) or not series:
			if y_axis:
				series = [{"y_axis": y_axis, "agg": agg}]
			else:
				raise HTTPException(
					status_code=400,
					detail="Missing series for composed chart",
				)
		agg_map = {}
		for item in series:
			item_y = item.get("y_axis")
			if not item_y:
				raise HTTPException(
					status_code=400,
					detail="Each series must include y_axis",
				)
			item_agg = item.get("agg", agg)
			if item_y in agg_map and agg_map[item_y] != item_agg:
				raise HTTPException(
					status_code=400,
					detail="Duplicate y_axis with different agg in series",
				)
			agg_map[item_y] = item_agg

		data = df.groupby(x_axis).agg(agg_map).reset_index()
		return ChartDataResponse(data=data.to_dict(orient="records"))

	if chart_type == "pie":
		if not y_axis:
			raise HTTPException(status_code=400, detail="Missing y_axis for pie chart")
		data = (
			df.groupby(x_axis)[y_axis]
			.agg(agg)
			.reset_index()
			.rename(columns={x_axis: "name", y_axis: "value"})
		)
		return ChartDataResponse(data=data.to_dict(orient="records"))

	if y_axis:
		if group_by:
			data = (
				df.groupby([x_axis, group_by])[y_axis]
				.agg(agg)
				.reset_index()
			)
		else:
			data = (
				df.groupby(x_axis)[y_axis]
				.agg(agg)
				.reset_index()
			)
		return ChartDataResponse(data=data.to_dict(orient="records"))

	data = df[[x_axis]].dropna().value_counts().reset_index()
	data.columns = [x_axis, "count"]
	return ChartDataResponse(data=data.to_dict(orient="records"))
