import React, { useState, useEffect } from 'react';

export default function Helium10Page() {
  const [clicked, setClicked] = useState(false);

  // Always start in "Click On Me" state on page load
  useEffect(() => {
    setClicked(false);
    // Clear any previous click flag so each session requires a fresh click
    localStorage.removeItem('helium10_button_clicked');
    document.documentElement.removeAttribute('data-helium10-clicked');
  }, []);

  const handleButtonClick = () => {
    setClicked(true);

    // Minimal set of signals from the original Cursor summary
    localStorage.setItem('helium10_button_clicked', 'true');
    localStorage.setItem('helium10_click_timestamp', Date.now().toString());

    // Let a content script listen via postMessage
    window.postMessage({
      type: 'HELIUM10_BUTTON_CLICKED',
      timestamp: Date.now()
    }, '*');

    // Also try talking to the extension runtime (if it listens)
    if (window.chrome && window.chrome.runtime) {
      try {
        window.chrome.runtime.sendMessage({
          type: 'HELIUM10_BUTTON_CLICKED',
          timestamp: Date.now()
        });
      } catch (e) {
        // Ignore runtime errors – extension might not be listening
        alert(e)
      }
    }

    // Simple DOM signal
    document.documentElement.setAttribute('data-helium10-clicked', 'true');

    console.log(Date.now(), 'ppp====')

    // Custom event another script could listen for
    window.dispatchEvent(new CustomEvent('helium10ButtonClicked', {
      detail: { timestamp: Date.now() }
    }));
  };

  return (
    <div className="helium-page">
      <h1 className="helium-title">Helium 10</h1>
      <p className="helium-sub">
        To access our tools first click on the button then on extention
      </p>
      <div className="helium-content-wrapper">
        <div className="helium-button-container">
          <button
            id="helium10-click-me-button"
            className="helium-big-button"
            onClick={handleButtonClick}
            data-clicked={clicked}
          >
            {clicked ? 'now click extension' : 'Click On Me'}
          </button>
        </div>
      </div>
      <p className="helium-note">
        In case the logout option is displayed on the tool, you can try clearing your cookies or
        cache.
        <br />
        If that does not work, it is recommended to immediately contact the support team for
        assistance.
      </p>
      <footer className="helium-footer">Freelancerservice © 2025</footer>
    </div>
  );
}
