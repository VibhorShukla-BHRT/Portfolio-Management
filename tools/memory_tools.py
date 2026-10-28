import chromadb
from chromadb.utils import embedding_functions
from crewai.tools import tool
import datetime
import math
import os
from simulation import unmask_ticker, mask_text

# ---------------------------------------------------------------------------
# Semantic Embedding via ChromaDB's built-in all-MiniLM-L6-v2 (384-dim)
# This replaces the previous SHA-256 hash embedding, which produced zero
# semantic similarity.  The ONNX model ships with chromadb and requires
# no additional dependencies.
# ---------------------------------------------------------------------------

# Initialize ChromaDB locally with semantic embeddings
db_path = os.path.join(os.getcwd(), ".chroma_db")
chroma_client = chromadb.PersistentClient(path=db_path)

semantic_ef = embedding_functions.DefaultEmbeddingFunction()  # all-MiniLM-L6-v2

collection_name = "financial_memory_v3"  # new collection — incompatible with v2 hash vectors
collection = chroma_client.get_or_create_collection(
    name=collection_name,
    embedding_function=semantic_ef
)

def _get_effective_datetime():
    """Return the simulated date if set, otherwise current datetime."""
    try:
        import tools.financial_tools as ft
        sim = getattr(ft, 'SIMULATED_DATE', None)
        if sim:
            return datetime.datetime.strptime(sim, "%Y-%m-%d")
    except Exception:
        pass
    return datetime.datetime.now()


@tool("Store Long Term Memory")
def store_memory(ticker: str, observation: str, importance: int) -> str:
    """
    Stores an important financial observation into layered memory.
    Inputs:
    - ticker: The stock ticker (e.g., 'AAPL')
    - observation: The summarized market observation or event.
    - importance: Integer 1-10 (1-3: Shallow, 4-7: Intermediate, 8-10: Deep).
    """
    try:
        canonical_ticker = unmask_ticker(ticker) or ticker
        effective_dt = _get_effective_datetime()
        doc_id = f"{canonical_ticker}_{effective_dt.isoformat()}_{os.urandom(4).hex()}"
        
        # Classify the memory layer based on importance
        if importance <= 3:
            layer = "shallow"
        elif importance <= 7:
            layer = "intermediate"
        else:
            layer = "deep"
            
        collection.add(
            documents=[observation],
            metadatas=[{
                "ticker": canonical_ticker,
                "importance": importance,
                "layer": layer,
                "timestamp": effective_dt.timestamp(),
                "date": effective_dt.isoformat()
            }],
            ids=[doc_id]
        )
        return f"Successfully stored memory for {ticker} in the {layer} layer."
    except Exception as e:
        return f"Observation noted for {ticker}, but long-term storage is currently unavailable."

@tool("Retrieve Long Term Memory")
def retrieve_memory(query: str, ticker: str, n_results: int = 3) -> str:
    """
    Retrieves historical context for a ticker using a composite score of Relevancy, Recency, and Importance.
    """
    try:
        canonical_ticker = unmask_ticker(ticker) or ticker
        if collection.count() == 0:
            return f"No relevant past memories found for {ticker} (memory is empty)."
            
        # Fetch more candidates than needed so we can re-rank them
        fetch_n = min(15, collection.count())
        
        results = collection.query(
            query_texts=[query],
            n_results=fetch_n,
            where={"ticker": canonical_ticker},
            include=["documents", "metadatas", "distances"]
        )
        
        if not results['documents'] or len(results['documents'][0]) == 0:
            return f"No relevant past memories found for {ticker}."
            
        effective_dt = _get_effective_datetime()
        current_time = effective_dt.timestamp()
        
        # Hyperparameters for the composite score
        alpha = 1.0   # Recency weight
        beta  = 1.0   # Relevancy weight (now meaningful with semantic embeddings)
        gamma = 0.5   # Importance weight
        
        # Layer-specific exponential decay rates (aligned with documentation)
        # Shallow  δ=0.95 → half-life ≈ 13.5 days  (high-freq news decays quickly)
        # Intermediate δ=0.99 → half-life ≈ 69 days (quarterly 10-Q cycles)
        # Deep     δ=0.999 → half-life ≈ 693 days   (multi-year crisis memories)
        DECAY_RATES = {
            "shallow":      0.95,
            "intermediate": 0.99,
            "deep":         0.999,
        }
        
        scored_memories = []
        
        for idx in range(len(results['documents'][0])):
            doc = results['documents'][0][idx]
            meta = results['metadatas'][0][idx]
            distance = results['distances'][0][idx] if 'distances' in results and results['distances'] else 1.0
            
            # 1. Semantic Relevancy S(m) = 1 / (1 + D(q, d_m))
            relevancy = 1.0 / (1.0 + distance)
            
            # 2. Recency with layer-specific exponential decay R(m) = δ^Δt
            time_elapsed_days = max(0, (current_time - meta['timestamp']) / 86400.0)
            layer = meta.get('layer', 'intermediate')
            delta = DECAY_RATES.get(layer, 0.99)
            recency = delta ** time_elapsed_days
            
            # 3. Importance (normalized 0.1 to 1.0)
            importance_score = meta['importance'] / 10.0
            
            # Composite score S_E = α·R(m) + β·S(m) + γ·I(m)
            S_E = (alpha * recency) + (beta * relevancy) + (gamma * importance_score)
            
            scored_memories.append({
                "score": S_E,
                "date": meta['date'],
                "layer": layer,
                "importance": meta['importance'],
                "doc": doc
            })
            
        # Sort by highest composite score
        scored_memories.sort(key=lambda x: x['score'], reverse=True)
        
        memories = f"Historical Memories for {ticker} (Ranked by Semantic Relevancy + Layered Time Decay):\n"
        for mem in scored_memories[:n_results]:
            memories += f"- [{mem['date']}] (Layer: {mem['layer']}, Importance: {mem['importance']}, Composite Score: {mem['score']:.2f}): {mem['doc']}\n"
            
        return mask_text(memories)
    except Exception as e:
        return f"No relevant past memories found for {ticker} (Memory retrieval unavailable right now)."
