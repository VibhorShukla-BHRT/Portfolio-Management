import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from crewai.tools import tool
import datetime
import math
import os
import hashlib

class SimpleHashEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            h = hashlib.sha256(text.encode()).digest()
            vec = [float(b) / 255.0 for b in h] * 12 # 384 dimensions
            embeddings.append(vec)
        return embeddings

# Initialize ChromaDB locally
db_path = os.path.join(os.getcwd(), ".chroma_db")
chroma_client = chromadb.PersistentClient(path=db_path)

collection_name = "financial_memory_v2"
collection = chroma_client.get_or_create_collection(
    name=collection_name,
    embedding_function=SimpleHashEmbeddingFunction()
)

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
        doc_id = f"{ticker}_{datetime.datetime.now().isoformat()}"
        
        # Classify the memory layer based on importance
        if importance <= 3:
            layer = "shallow"
        elif importance <= 7:
            layer = "intermediate"
        else:
            layer = "deep"
            
        collection.add(
            documents=[observation],
            metadatas=[{"ticker": ticker, "importance": importance, "layer": layer, "timestamp": datetime.datetime.now().timestamp(), "date": datetime.datetime.now().isoformat()}],
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
        if collection.count() == 0:
            return f"No relevant past memories found for {ticker} (memory is empty)."
            
        # Fetch more candidates than needed so we can re-rank them
        fetch_n = min(15, collection.count())
        
        results = collection.query(
            query_texts=[query],
            n_results=fetch_n,
            where={"ticker": ticker},
            include=["documents", "metadatas", "distances"]
        )
        
        if not results['documents'] or len(results['documents'][0]) == 0:
            return f"No relevant past memories found for {ticker}."
            
        current_time = datetime.datetime.now().timestamp()
        
        # Hyperparameters for the composite score
        alpha = 1.0 # Recency weight
        beta = 1.0  # Relevancy weight
        gamma = 0.5 # Importance weight
        
        scored_memories = []
        
        for idx in range(len(results['documents'][0])):
            doc = results['documents'][0][idx]
            meta = results['metadatas'][0][idx]
            distance = results['distances'][0][idx] if 'distances' in results and results['distances'] else 1.0
            
            # 1. Relevancy (inverted distance - lower distance is better)
            relevancy = 1.0 / (1.0 + distance)
            
            # 2. Recency with layer-specific exponential decay
            time_elapsed_days = (current_time - meta['timestamp']) / 86400.0
            layer = meta.get('layer', 'intermediate')
            
            if layer == "shallow":
                delta = 0.1 # Decays significantly over a few weeks
            elif layer == "intermediate":
                delta = 0.01 # Decays over a few months
            else: # deep
                delta = 0.0001 # Near-zero decay
                
            recency = math.exp(-delta * time_elapsed_days)
            
            # 3. Importance (normalized 0.1 to 1.0)
            importance_score = meta['importance'] / 10.0
            
            # Calculate composite score S_E
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
        
        memories = "Historical Memories (Ranked by Relevancy + Layered Time Decay):\n"
        for mem in scored_memories[:n_results]:
            memories += f"- [{mem['date']}] (Layer: {mem['layer']}, Importance: {mem['importance']}, Composite Score: {mem['score']:.2f}): {mem['doc']}\n"
            
        return memories
    except Exception as e:
        return f"No relevant past memories found for {ticker} (Memory retrieval unavailable right now)."
