import re
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qwen_agent.agents import Assistant
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware to allow requests from Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestData(BaseModel):
    content: str

# Initialize the Qwen Assistant without code_interpreter
bot = Assistant(
    llm={
        "model": "qwen3:1.7b",
        "model_server": "http://localhost:11434/v1",
        "api_key": "EMPTY",
        "generate_cfg": {
            "max_input_tokens": 4000  # Set a safe limit
        }
    },
    function_list=[],  # No tools needed for summarization
    system_message="You are a summarization assistant. Directly output the cleaned summary of the given text without any reasoning, self-talk, thoughts, or internal planning steps. Do not include phrases like 'I think', 'maybe', 'let's', 'the user wants', or anything not part of the final summary. Your output must look like it was written by an editor, not a model."
)

def truncate_text(text: str, max_tokens: int = 3500) -> str:
    """
    Truncate text to approximately max_tokens.
    Rough estimate: 1 token ≈ 4 characters for English text.
    """
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text
    
    # Truncate and add notice
    truncated = text[:max_chars]
    # Try to cut at sentence boundary
    last_period = truncated.rfind('.')
    last_newline = truncated.rfind('\n')
    cut_point = max(last_period, last_newline)
    
    if cut_point > max_chars * 0.8:  # Only cut at sentence if it's not too far back
        truncated = truncated[:cut_point + 1]
    
    return truncated + "\n\n[Content truncated due to length...]"

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "Qwen Web Summarizer API is active",
        "endpoints": ["/summarize_stream_status"]
    }

@app.post("/summarize_stream_status")
async def summarize_stream_status(data: RequestData):
    user_input = data.content
    
    def stream():
        try:
            yield "🔍 Reading content on website...\n"
            
            # Get original length
            original_length = len(user_input)
            original_tokens = original_length // 4  # Rough estimate
            
            # Truncate if needed
            processed_input = truncate_text(user_input, max_tokens=3500)
            processed_length = len(processed_input)
            
            if processed_length < original_length:
                yield f"⚠️ Content truncated: ~{original_tokens:,} tokens → ~{processed_length//4:,} tokens\n"
            
            logger.info(f"Processing text: {processed_length} chars (~{processed_length//4} tokens)")
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a summarization assistant. Directly output the cleaned summary of the given text without any reasoning, self-talk, thoughts, or internal planning steps. Do not include phrases like 'I think', 'maybe', 'let's', 'the user wants', or anything not part of the final summary. Your output must look like it was written by an editor, not a model."
                },
                {
                    "role": "user",
                    "content": f"<nothink>\nSummarize the following text clearly and concisely. Do not include any internal thoughts, planning, or reasoning. Just return the final summary:\n\n{processed_input}\n</nothink>"
                }
            ]
            
            yield "🧠 Generating summary...\n"
            
            result = bot.run(messages)
            result_list = list(result)
            logger.info(f"Raw result: {result_list}")
            
            # Extract summary from response
            last_content = None
            for item in reversed(result_list):
                if isinstance(item, list):
                    for subitem in reversed(item):
                        if isinstance(subitem, dict) and "content" in subitem:
                            last_content = subitem["content"]
                            break
                if last_content:
                    break
            
            if not last_content:
                yield "⚠️ No valid summary found.\n"
                return
            
            # Clean up the summary
            summary = re.sub(r"</?think>", "", last_content)
            summary = re.sub(
                r"(?s)^.*?(Summary:|Here's a summary|The key points are|Your tutorial|This tutorial|To summarize|Final summary:)", 
                "", 
                summary, 
                flags=re.IGNORECASE
            )
            summary = re.sub(r"\n{3,}", "\n\n", summary)
            summary = summary.strip()
            
            yield "\n📄 Summary:\n" + summary + "\n"
            
            if processed_length < original_length:
                yield "\n\nℹ️ Note: This summary is based on the first portion of the page due to length constraints.\n"
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            yield f"\n❌ Error: {str(e)}\n"
    
    return StreamingResponse(stream(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7864)