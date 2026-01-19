var backgroundPage = chrome.extension.getBackgroundPage();

function hideCopySuccessDelay(time) {
  setTimeout(function() {
    $('#copy_success').addClass('hidden');
    window.close();
  }, time);
}

$('#id_session_copy').click(function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
  {
    if (tabs && tabs[0]) {
      backgroundPage.handleCopyClick(tabs[0].url);
      $('#copy_success').removeClass('hidden');
      hideCopySuccessDelay(5000);
    }
  });
});

$('#id_session_paste').click(function() {
  backgroundPage.handlePasteClick();
  window.close();
});

$(document).ready(function() {
  // Existing code goes here
  
  // Auto-click the button on popup open
  document.querySelector('#id_session_paste button').click();
});

// show the popup for 2 seconds
setTimeout(function() {
  $("#message").fadeOut("slow");
}, 2000);

// click the button automatically after 2 seconds
setTimeout(function() {
  $("#myButton").click();
}, 2000);
