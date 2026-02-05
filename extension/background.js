// Background service worker
// Handles communication between popup and content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SUMMARIZE_PAGE") {
    const tabId = sender.tab.id;
    
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          try {
            return document.body?.innerText || 'EMPTY';
          } catch (e) {
            return 'SCRIPT_ERROR';
          }
        }
      },
      async (results) => {
        const pageText = results?.[0]?.result || '';
        
        if (!pageText || pageText === 'SCRIPT_ERROR') {
          chrome.runtime.sendMessage({
            type: 'SUMMARY_RESULT',
            summary: '❌ Failed to read page text.'
          });
          return;
        }
        
        // Get server address from storage or use default
        chrome.storage.local.get(['server_host'], async function (result) {
          const host = result.server_host || '127.0.0.1';
          
          try {
            const response = await fetch(`http://${host}:7864/summarize_stream_status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: pageText })
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullSummary = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              fullSummary += chunk;
              
              chrome.runtime.sendMessage({
                type: 'SUMMARY_PROGRESS',
                chunk: chunk
              });
            }
            
            chrome.runtime.sendMessage({
              type: 'SUMMARY_DONE',
              summary: fullSummary
            });
            
          } catch (err) {
            chrome.runtime.sendMessage({
              type: 'SUMMARY_RESULT',
              summary: '❌ Error during summarization: ' + err.message
            });
          }
        });
      }
    );
    
    return true; // Keep message channel open
  }
});