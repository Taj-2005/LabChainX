"""
LabChain ML Server
FastAPI server for protocol standardization, autocomplete, and missing parameter detection
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import json

# Load environment variables
load_dotenv()

app = FastAPI(
    title="LabChain ML Server",
    description="ML services for protocol standardization and autocomplete",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Request/Response Models
class StandardizeRequest(BaseModel):
    text: str
    context: Optional[Dict[str, Any]] = None

class StandardizeResponse(BaseModel):
    protocol: Dict[str, Any]
    confidence: float
    extracted_steps: List[Dict[str, Any]]

class AutocompleteRequest(BaseModel):
    current_steps: List[Dict[str, Any]]
    partial_text: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AutocompleteResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: float
    reasoning: Optional[str] = None

class DetectMissingRequest(BaseModel):
    protocol: Dict[str, Any]
    step_index: Optional[int] = None

class DetectMissingResponse(BaseModel):
    missing_params: List[str]
    suggestions: Dict[str, Any]
    completeness_score: float

@app.get("/")
def root():
    return {
        "message": "LabChain ML Server",
        "version": "1.0.0",
        "endpoints": [
            "/standardize",
            "/autocomplete",
            "/detect-missing",
            "/health"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml-server"}

@app.post("/standardize", response_model=StandardizeResponse)
async def standardize_protocol(request: StandardizeRequest):
    """
    Convert free text protocol description into structured protocol format.
    """
    try:
        # Use OpenAI to extract and structure the protocol
        prompt = f"""
        Convert the following laboratory protocol description into a structured JSON format.
        Extract steps, reagents, equipment, timing, and notes.
        
        Protocol text:
        {request.text}
        
        Return a JSON object with this structure:
        {{
            "title": "Protocol title",
            "description": "Brief description",
            "steps": [
                {{
                    "title": "Step title",
                    "reagents": ["reagent1", "reagent2"],
                    "timing": "e.g., 30 minutes",
                    "equipment": ["equipment1"],
                    "notes": "Additional notes"
                }}
            ]
        }}
        """
        
        if not openai.api_key:
            # Fallback to rule-based extraction if OpenAI is not configured
            return _fallback_standardize(request.text)
        
        try:
            client = openai.OpenAI(api_key=openai.api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a scientific protocol parser. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            protocol_data = json.loads(content)
            
            # Extract steps into proper format
            extracted_steps = []
            for i, step in enumerate(protocol_data.get("steps", []), 1):
                extracted_steps.append({
                    "id": f"step-{i}",
                    "order": i,
                    "title": step.get("title", f"Step {i}"),
                    "reagents": step.get("reagents", []),
                    "timing": step.get("timing", ""),
                    "equipment": step.get("equipment", []),
                    "notes": step.get("notes", "")
                })
            
            return StandardizeResponse(
                protocol={
                    "title": protocol_data.get("title", "Extracted Protocol"),
                    "description": protocol_data.get("description", ""),
                    "steps": extracted_steps
                },
                confidence=0.85,
                extracted_steps=extracted_steps
            )
        except Exception as e:
            print(f"OpenAI error: {e}")
            return _fallback_standardize(request.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Standardization failed: {str(e)}")

@app.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete_step(request: AutocompleteRequest):
    """
    Suggest next step for protocol based on current steps and context.
    """
    try:
        # Build context from current steps
        steps_summary = "\n".join([
            f"Step {i+1}: {step.get('title', '')}" 
            for i, step in enumerate(request.current_steps)
        ])
        
        prompt = f"""
        Based on the following protocol steps, suggest the next logical step:
        
        Current steps:
        {steps_summary}
        
        {'Partial text: ' + request.partial_text if request.partial_text else ''}
        
        Suggest the next step in this format:
        {{
            "title": "Step title",
            "reagents": ["suggested reagents"],
            "timing": "suggested timing",
            "equipment": ["suggested equipment"],
            "notes": "reasoning or notes"
        }}
        """
        
        if not openai.api_key:
            # Fallback to simple suggestions
            return _fallback_autocomplete(request.current_steps)
        
        try:
            client = openai.OpenAI(api_key=openai.api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a scientific protocol assistant. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            suggestion = json.loads(content)
            
            return AutocompleteResponse(
                suggestions=[suggestion],
                confidence=0.80,
                reasoning="Generated based on protocol context"
            )
        except Exception as e:
            print(f"OpenAI error: {e}")
            return _fallback_autocomplete(request.current_steps)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autocomplete failed: {str(e)}")

@app.post("/detect-missing", response_model=DetectMissingResponse)
async def detect_missing_parameters(request: DetectMissingRequest):
    """
    Detect missing parameters in a protocol or specific step.
    """
    try:
        protocol = request.protocol
        steps = protocol.get("steps", [])
        
        missing_params = []
        suggestions = {}
        
        # Check each step for missing parameters
        for i, step in enumerate(steps):
            step_missing = []
            step_suggestions = {}
            
            if not step.get("title") or step.get("title", "").strip() == "":
                step_missing.append("title")
            
            if not step.get("reagents") or len(step.get("reagents", [])) == 0:
                step_missing.append("reagents")
                step_suggestions["reagents"] = ["Consider adding required reagents"]
            
            if not step.get("timing") or step.get("timing", "").strip() == "":
                step_missing.append("timing")
                step_suggestions["timing"] = "Consider adding timing/duration"
            
            if not step.get("equipment") or len(step.get("equipment", [])) == 0:
                step_missing.append("equipment")
                step_suggestions["equipment"] = ["Consider adding required equipment"]
            
            if step_missing:
                missing_params.append(f"Step {i+1}: {', '.join(step_missing)}")
                suggestions[f"step_{i+1}"] = step_suggestions
        
        # Calculate completeness score
        total_params = len(steps) * 4  # title, reagents, timing, equipment
        filled_params = sum([
            (1 if step.get("title") else 0) +
            (1 if step.get("reagents") and len(step.get("reagents", [])) > 0 else 0) +
            (1 if step.get("timing") else 0) +
            (1 if step.get("equipment") and len(step.get("equipment", [])) > 0 else 0)
            for step in steps
        ])
        completeness_score = filled_params / total_params if total_params > 0 else 1.0
        
        return DetectMissingResponse(
            missing_params=missing_params,
            suggestions=suggestions,
            completeness_score=round(completeness_score, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

# Fallback functions for when OpenAI is not available
def _fallback_standardize(text: str):
    """Fallback standardization using simple parsing."""
    lines = text.split("\n")
    steps = []
    current_step = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Simple pattern matching
        if any(word in line.lower() for word in ["step", "procedure", "method"]):
            if current_step:
                steps.append(current_step)
            current_step = {
                "id": f"step-{len(steps) + 1}",
                "order": len(steps) + 1,
                "title": line,
                "reagents": [],
                "timing": "",
                "equipment": [],
                "notes": ""
            }
        elif current_step:
            current_step["notes"] += " " + line
    
    if current_step:
        steps.append(current_step)
    
    return StandardizeResponse(
        protocol={
            "title": "Extracted Protocol",
            "description": "",
            "steps": steps
        },
        confidence=0.5,
        extracted_steps=steps
    )

def _fallback_autocomplete(current_steps: List[Dict[str, Any]]):
    """Fallback autocomplete suggestions."""
    generic_suggestions = [
        {
            "title": "Document Results",
            "reagents": [],
            "timing": "",
            "equipment": [],
            "notes": "Record observations and results"
        },
        {
            "title": "Clean Up",
            "reagents": [],
            "timing": "",
            "equipment": [],
            "notes": "Clean and store equipment"
        }
    ]
    
    return AutocompleteResponse(
        suggestions=generic_suggestions[:1],
        confidence=0.3,
        reasoning="Generic suggestion"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

