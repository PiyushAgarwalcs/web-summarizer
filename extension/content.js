// Content script - runs on every webpage
// Listens for messages from the popup or background script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_TEXT") {
    try {
      const bodyText = document.body.innerText.trim();
      sendResponse({ text: bodyText || null });
    } catch (error) {
      sendResponse({ text: null, error: error.message });
    }
  }
  return true; // Keep the message channel open for async response
});