document.addEventListener('DOMContentLoaded', function () {
  const serverAddress = '127.0.0.1';
  const summarizeBtn = document.getElementById('summarizeBtn');
  const outputElement = document.getElementById('output');
  const statusElement = document.getElementById('status');

  summarizeBtn.addEventListener('click', async () => {
    // Disable button during processing
    summarizeBtn.disabled = true;
    summarizeBtn.textContent = 'Processing...';
    outputElement.innerText = 'Extracting page content...\n';
    statusElement.innerText = '';

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Execute script to extract page text
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            return document.body?.innerText || 'EMPTY';
          } catch (e) {
            return 'SCRIPT_ERROR';
          }
        }
      });

      const pageText = results?.[0]?.result || '';
      console.log('✓ Extracted text:', pageText.slice(0, 500));

      // Handle errors
      if (pageText === 'SCRIPT_ERROR') {
        outputElement.innerText = '❌ Could not access page content (script error).';
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = 'Summarize This Page';
        return;
      }

      if (!pageText || pageText.trim() === 'EMPTY') {
        outputElement.innerText = '⚠️ No page text found. Try a different page.';
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = 'Summarize This Page';
        return;
      }

      // Send to backend for summarization
      console.log(`✓ Sending POST to http://${serverAddress}:7864/summarize_stream_status`);
      
      const response = await fetch(`http://${serverAddress}:7864/summarize_stream_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: pageText })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        resultText += chunk;
        outputElement.innerText = resultText;
        
        // Auto-scroll to bottom
        outputElement.scrollTop = outputElement.scrollHeight;
      }

      statusElement.innerText = '✓ Summary complete!';

    } catch (err) {
      console.error('❌ Fetch error:', err);
      outputElement.innerText = `❌ Failed to get summary.\n\nError: ${err.message}\n\nMake sure:\n1. The backend server is running (uvicorn app:app --host 0.0.0.0 --port 7864)\n2. Ollama is serving the model (ollama serve)`;
      statusElement.innerText = '❌ Error occurred';
    } finally {
      // Re-enable button
      summarizeBtn.disabled = false;
      summarizeBtn.textContent = 'Summarize This Page';
    }
  });
});